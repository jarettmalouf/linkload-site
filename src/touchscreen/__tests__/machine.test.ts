/**
 * Behavior beyond the spec's test table: decisions made while building.
 */
import { describe, expect, it } from "vitest";
import { createMachine, leds, placeToggle, previewRun, washerStartsAt } from "../machine";
import { applyAutoScan, dryPreset, washPreset } from "../programs";
import { clockLabel } from "../scheduler";
import { homeOptions, pickerTarget, systemScreen } from "../screens";
import type { NotebookBits } from "../types";
import { at, machine, pm, reduce, tick, times, trace } from "./helpers";

describe("Longest-likely margin", () => {
  it("Auto unsure adds 5 minutes", () => {
    const s = applyAutoScan(washPreset("auto"), "unsure", { autoUnsureMarginMin: 5 });
    expect(s.dryMarginMin).toBe(5);
    expect(createMachine().config.autoUnsureMarginMin).toBe(5);
  });

  it("a wash added while the last load dries is staggered against that dry's margin too", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55, 5))], doneBy: null, eco: false } });
    // Wash 55, transfer 2: the dry starts at 12:57 and likely ends at 1:57 (55 + 5).
    let t = trace(s, 67);
    expect(t.state.dryer?.status).toBe("drying");
    const dryStart = t.dryStart.values().next().value as number;
    expect(dryStart).toBe(pm(0, 57));

    // Ten minutes into the dry, someone loads a 40-minute wash into the queue.
    s = reduce(t.state, { type: "LOAD_PLACE", place: "queue" });
    s = reduce(s, { type: "ADD_TO_RUN", load: at("queue", times(40, 40)) });
    const newId = s.washer!.load.id;
    expect(washerStartsAt(s)).toBe(dryStart + 55 + 5 - 40);

    t = trace(s, 3 * 60);
    expect(t.washStart.get(newId)).toBe(dryStart + 20);
    // The dry ends on its nominal time and tumbles until the wash is done.
    expect(t.transferStart.get(newId)).toBe(dryStart + 60);
    expect(t.transferStart.get(newId)! - t.washEnd.get(newId)!).toBe(0);
  });
});

describe("Done By", () => {
  it("rule 7: offers the earliest finish when the deadline can't be met", () => {
    const s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    const p = previewRun(s, { loads: [at("washer", times(55, 55))], doneBy: pm(1), eco: false });
    expect(p.feasible).toBe(false);
    expect(p.earliestFinish).toBe(pm(0) + 55 + 2 + 55);
  });

  it("single load finishes at the deadline", () => {
    const s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    const p = previewRun(s, { loads: [at("washer", times(55, 55))], doneBy: pm(6, 30), eco: false });
    expect(p.feasible).toBe(true);
    expect(clockLabel(p.startAt)).toBe("4:38 PM");
  });

  it("Auto previews with the unsure margin, then re-plans after the scan", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    const input = { loads: [at("washer", washPreset("auto"))], doneBy: pm(6, 30), eco: false };
    expect(clockLabel(previewRun(s, input).startAt)).toBe("4:43 PM"); // 45 + 2 + 55 + 5
    s = reduce(s, { type: "START_RUN", input }); // scan outcome: confident
    expect(clockLabel(s.run!.startAt)).toBe("4:48 PM");
  });

  it("rules 6 and 8: a full machine warns that the third load needs the drawer", () => {
    const s = reduce(machine(), { type: "SET_START_MODE", bits: "111" });
    const input = {
      loads: [at("dryer", dryPreset("normal"), "dry-only" as const), at("washer", times(55, 55)), at("queue", times(55, 55))],
      doneBy: pm(11),
      eco: false,
    };
    const p = previewRun(s, input);
    expect(p.warnings).toContainEqual({ kind: "needs-drawer", loadId: s.queue!.id });
    expect(p.warnings).toContainEqual({ kind: "drawer-blocks-done-by" });
    expect(p.blockedByDrawer).toBe(true);
  });
});

describe("Joining a running dry", () => {
  const dryRunning = () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "110" });
    // 55-minute dry starts at noon; it likely ends at 12:55.
    return reduce(s, { type: "START_RUN", input: { loads: [at("dryer", dryPreset("normal"), "dry-only")], doneBy: null, eco: false } });
  };

  it("without Done By, the wash staggers against the running dry", () => {
    const s = reduce(dryRunning(), { type: "START_RUN", input: { loads: [at("washer", times(40, 40))], doneBy: null, eco: false } });
    expect(washerStartsAt(s)).toBe(pm(0, 15));
  });

  it("with Done By, the wash holds so the run finishes at the deadline", () => {
    let s = dryRunning();
    const input = { loads: [at("washer", times(40, 40))], doneBy: pm(6), eco: false };
    const p = previewRun(s, input);
    expect(p.feasible).toBe(true);
    // 6:00 − 40 dry − 2 transfer − 40 wash = 4:38
    expect(clockLabel(p.startAt)).toBe("4:38 PM");
    s = reduce(s, { type: "START_RUN", input });
    const id = s.washer!.load.id;
    const t = trace(s, 7 * 60);
    expect(clockLabel(t.washStart.get(id)!)).toBe("4:38 PM");
    // The dry-only load waits finished for the transfer instead of tumbling for hours.
    expect(t.state.drawer).not.toBeNull();
    expect(t.state.dryer?.load.id).toBe(id);
    expect(t.state.run).toBeNull();
  });

  it("a deadline that can't be met offers the earliest finish", () => {
    const p = previewRun(dryRunning(), { loads: [at("washer", times(40, 40))], doneBy: pm(1), eco: false });
    expect(p.feasible).toBe(false);
    // Wash 12:15–12:55, transfer to 12:57, dry to 1:37.
    expect(clockLabel(p.earliestFinish)).toBe("1:37 PM");
  });
});

describe("Eco Mode", () => {
  const window = (doneBy: number | null) => {
    const s = reduce(machine(pm(3)), { type: "SET_START_MODE", bits: "010" });
    return previewRun(s, { loads: [at("washer", times(55, 55))], doneBy, eco: true });
  };

  it("without Done By, finishes at the 6 AM wake-up inside the off-peak window", () => {
    const p = window(null);
    expect(clockLabel(p.finishAt)).toBe("6:00 AM");
    expect(clockLabel(p.startAt)).toBe("4:08 AM");
  });

  it("with Done By, picks the cheapest window before the deadline", () => {
    expect(clockLabel(window(pm(11)).finishAt)).toBe("11:00 PM");
    // Deadline 8 PM is before off-peak: no cheap minutes, so finish at the deadline.
    expect(clockLabel(window(pm(8)).finishAt)).toBe("8:00 PM");
  });
});

describe("Transfer failure", () => {
  it("retries three times silently, then pauses with instructions; Resume dries the load", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55))], doneBy: null, eco: false } });
    s = reduce(s, { type: "FORCE_TRANSFER_FAIL" });
    s = tick(s, { simMin: 55 + 2 * 2 });
    expect(s.transfer?.attempt).toBe(3);
    expect(systemScreen(s)).toBe("transfer");
    s = tick(s, { simMin: 2 });
    expect(s.failure).not.toBeNull();
    expect(s.washer?.status).toBe("paused");
    expect(systemScreen(s)).toBe("failed");
    expect(s.notifications.some((n) => n.kind === "transfer-failed")).toBe(true);

    s = reduce(s, { type: "RESUME_AFTER_FAILURE" });
    expect(s.dryer?.status).toBe("drying");
    expect(s.washer).toBeNull();
  });
});

describe("Hang-dry window", () => {
  const toWindow = () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "011" });
    const net = times(55, 55);
    net.wash.hangDryNet = true;
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", net), at("queue", times(40, 40))], doneBy: null, eco: false } });
    s = tick(s, { simMin: 57 });
    expect(s.hangDry?.secondsLeft).toBe(30);
    expect(systemScreen(s)).toBe("hang-dry");
    return s;
  };

  it("the next load waits for the window; timing out leaves clothes in the net", () => {
    let s = toWindow();
    s = tick(s, { simMin: 0.2, realSec: 12 });
    expect(s.queue).not.toBeNull();
    s = tick(s, { realSec: 18 });
    expect(s.hangDry).toBeNull();
    expect(s.netHasClothes).toBe(true);
    expect(s.queue).toBeNull(); // dropped into the washer
  });

  it("Yes unlocks the drum and stops the countdown; Resume clears the net", () => {
    let s = reduce(toWindow(), { type: "HANG_DRY_YES" });
    s = tick(s, { realSec: 60 });
    expect(s.hangDry?.unlocked).toBe(true);
    s = reduce(s, { type: "HANG_DRY_RESUME" });
    expect(s.hangDry).toBeNull();
    expect(s.netHasClothes).toBe(false);
  });
});

describe("Dry runs past estimate", () => {
  it("the wet load waits in the washer, then transfers when the dry ends", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "011" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55)), at("queue", times(55, 55))], doneBy: null, eco: false } });
    s = tick(s, { simMin: 60 });
    s = reduce(s, { type: "DRY_OVERRUN", minutes: 15 });
    s = tick(s, { simMin: 55 });
    expect(s.washer?.status).toBe("wet");
    expect(s.dryer?.status).toBe("drying");
    // The dry now ends at 2:07 instead of 1:52; the transfer runs 2:07–2:09.
    s = tick(s, { simMin: 13 });
    expect(s.transfer).not.toBeNull();
  });
});

describe("Auto scan", () => {
  it("runs as Normal when the scan fails or video is off", () => {
    for (const ev of [{ type: "SET_SCAN_OUTCOME", outcome: "fail" }, { type: "SET_VIDEO", enabled: false }] as const) {
      let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
      s = reduce(s, ev);
      s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", washPreset("auto"))], doneBy: null, eco: false } });
      expect(s.washer?.load.settings?.program).toBe("normal");
    }
  });
});

describe("Screens", () => {
  it.each<[NotebookBits, Partial<ReturnType<typeof homeOptions>>]>([
    ["000", { empty: true, fullRun: false }],
    ["001", { fullRun: true, washOnly: true }],
    ["010", { fullRun: true, washOnly: true }],
    ["011", { fullRun: true, washOnly: true }],
    // A raw dryer load always goes first, straight to the dry settings.
    ["100", { straightToDryOnly: true, fullRun: false }],
    ["101", { straightToDryOnly: true, fullRun: false }],
    ["110", { straightToDryOnly: true, fullRun: false }],
    ["111", { straightToDryOnly: true, fullRun: false }],
  ])("home for mode %s", (bits, expected) => {
    expect(homeOptions(bits)).toMatchObject(expected);
    const s = reduce(machine(), { type: "SET_START_MODE", bits });
    expect(systemScreen(s)).toBe(bits === "000" ? "ready" : bits[0] === "1" ? "dry-only" : "home");
  });

  it("after the dryer load starts, the washer load is offered next", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "110" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("dryer", dryPreset("normal"), "dry-only")], doneBy: null, eco: false } });
    expect(s.dryer?.status).toBe("drying");
    expect(systemScreen(s)).toBe("home");
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55))], doneBy: null, eco: false } });
    expect(systemScreen(s)).toBe("progress");
  });

  it("one picker: the washer's load, or the queue's when the washer is empty", () => {
    expect(pickerTarget(reduce(machine(), { type: "SET_START_MODE", bits: "011" }), "full-run").place).toBe("washer");
    expect(pickerTarget(reduce(machine(), { type: "SET_START_MODE", bits: "001" }), "full-run").place).toBe("queue");
    expect(pickerTarget(machine(), "queue-another").place).toBe("queue");
    expect(pickerTarget(machine(), "dry-only")).toEqual({ place: "dryer", kind: "dry" });
  });

  it("the purple LED lights only the place being configured, wash or dry alike", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "110" });
    s = reduce(s, { type: "CONFIGURE", place: "washer", kind: "wash" });
    expect(leds(s)).toEqual({ queue: false, washer: true, dryer: false });
    s = reduce(s, { type: "CONFIGURE", place: "dryer", kind: "dry" });
    expect(leds(s)).toEqual({ queue: false, washer: false, dryer: true });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55))], doneBy: null, eco: false } });
    expect(leds(s)).toEqual({ queue: false, washer: false, dryer: false });
  });

  it("machine view taps: load or empty a place, but never a load mid-cycle", () => {
    let s = machine();
    expect(placeToggle(s, "washer")).toBe("load");
    s = reduce(s, { type: "LOAD_PLACE", place: "washer" });
    expect(placeToggle(s, "washer")).toBe("empty");
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55))], doneBy: null, eco: false } });
    expect(placeToggle(s, "washer")).toBeNull();
    expect(placeToggle(s, "drawer")).toBe("load");
    s = tick(s, { simMin: 60 });
    expect(placeToggle(s, "dryer")).toBeNull(); // drying
    s = tick(s, { simMin: 60 });
    expect(placeToggle(s, "dryer")).toBe("empty"); // dry: take it out
  });

  it("sleeps after 30 idle seconds, wakes for the transfer, then sleeps again", () => {
    let s = createMachine({ now: pm(0) });
    s = reduce(s, { type: "SET_START_MODE", bits: "010" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", times(55, 55))], doneBy: null, eco: false } });
    s = tick(s, { realSec: 31 });
    expect(systemScreen(s)).toBe("sleep");
    s = tick(s, { simMin: 56 });
    expect(systemScreen(s)).toBe("transfer");
    s = tick(s, { simMin: 2 });
    expect(systemScreen(s)).toBe("sleep");
    s = reduce(s, { type: "APPROACH" });
    expect(systemScreen(s)).toBe("progress");
  });
});
