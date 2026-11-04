/**
 * One test per row of the spec's scheduler test table
 * (docs/touchscreen/SPEC.md → "The scheduler tests must cover").
 * Expected values come from docs/touchscreen/reference/scheduler_check.py.
 *
 * Each timing row is checked twice: against the closed-form notebook plan,
 * and by running the real state machine minute by minute.
 */
import { describe, expect, it } from "vitest";
import { clearance, washerBlock } from "../machine";
import { systemScreen } from "../screens";
import { washPreset } from "../programs";
import { canStartWash, clock12, fullCycle, planTwoLoads } from "../scheduler";
import type { MachineState } from "../types";
import { at, machine, pm, reduce, times, trace } from "./helpers";

const DONE = pm(6, 30);
const T = 2;

const timingRows = [
  {
    name: "Notebook example",
    l1: { wash: 55, dry: 65 },
    l2: { wash: 45, dry: 55 },
    start: "3:31",
    secondWash: "4:48",
    total: 179,
  },
  {
    name: "Second wash longer than first dry",
    l1: { wash: 55, dry: 40 },
    l2: { wash: 70, dry: 55 },
    start: "3:26",
    secondWash: "4:23",
    total: 184,
  },
  {
    name: "10-minute dry margin",
    l1: { wash: 55, dry: 65, dryMargin: 10 },
    l2: { wash: 45, dry: 55 },
    start: "3:21",
    secondWash: "4:48",
    total: 189,
  },
];

describe.each(timingRows)("$name", (row) => {
  it("closed form: start, second wash, zero wet wait", () => {
    const p = planTwoLoads(row.l1, row.l2, T, DONE);
    expect(fullCycle(row.l1, row.l2, T)).toBe(row.total);
    expect(clock12(p.start)).toBe(row.start);
    expect(clock12(p.w2Start)).toBe(row.secondWash);
    expect(p.wetWait).toBe(0);
    expect(clock12(p.d2End)).toBe("6:30");
  });

  it("machine: Done By 6:30 runs on the same schedule", () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "011" });
    const washerId = s.washer!.load.id;
    const queueId = s.queue!.id;
    s = reduce(s, {
      type: "START_RUN",
      input: {
        loads: [
          at("washer", times(row.l1.wash, row.l1.dry, row.l1.dryMargin ?? 0)),
          at("queue", times(row.l2.wash, row.l2.dry)),
        ],
        doneBy: DONE,
        eco: false,
      },
    });
    expect(clock12(s.run!.startAt)).toBe(row.start);

    const t = trace(s, 9 * 60);
    expect(clock12(t.washStart.get(washerId)!)).toBe(row.start);
    expect(clock12(t.washStart.get(queueId)!)).toBe(row.secondWash);
    // Wet wait: the second load transfers the minute its wash ends.
    expect(t.transferStart.get(queueId)! - t.washEnd.get(queueId)!).toBe(0);
    // Load 2 finishes drying at the deadline and load 1 is in the drawer.
    expect(t.state.dryer?.load.id).toBe(queueId);
    expect(t.state.dryer?.status).toBe("finished");
    expect(t.state.drawer?.id).toBe(washerId);
    expect(t.state.run).toBeNull();
  });
});

describe("Dryer loaded, drawer full", () => {
  it("start rule: a wash can't start", () => {
    expect(canStartWash("occupied", "full")).toBe(false);
    // The rest of the truth table from scheduler_check.py.
    expect(canStartWash("empty", "empty")).toBe(true);
    expect(canStartWash("empty", "full")).toBe(true);
    expect(canStartWash("occupied", "empty")).toBe(true);
  });

  const blocked = (dryerStatus: "finished" | "drying"): MachineState => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    s = reduce(s, { type: "LOAD_PLACE", place: "drawer" });
    s.dryer = {
      load: { id: "old", settings: washPreset("normal"), plan: dryerStatus === "drying" ? "dry-only" : null },
      status: dryerStatus,
      remaining: dryerStatus === "drying" ? 30 : 0,
      margin: 0,
    };
    return reduce(s, { type: "START_RUN", input: { loads: [at("washer", washPreset("heavy-duty"))], doneBy: null, eco: false } });
  };

  it.each(["finished", "drying"] as const)("machine: wash never starts with the dryer %s", (status) => {
    const t = trace(blocked(status), 6 * 60);
    expect(t.washStart.size).toBe(0);
    expect(t.state.washer?.status).toBe("waiting");
    expect(washerBlock(t.state)).toBe("drawer");
    // By now the dryer's load is dry, so taking it out of the dryer is enough.
    expect(clearance(t.state).places).toEqual(["dryer"]);
    expect(t.state.notifications.some((n) => n.kind === "drawer-full")).toBe(true);
  });

  it("while the dryer is still drying, only the done drawer can be emptied", () => {
    expect(clearance(blocked("drying")).places).toEqual(["drawer"]);
  });

  it("machine: emptying the drawer starts the waiting wash", () => {
    let s = trace(blocked("finished"), 60).state;
    s = reduce(s, { type: "EMPTY_PLACE", place: "drawer" });
    expect(s.washer?.status).toBe("washing");
  });
});

describe("Unattended limit", () => {
  /** Offer an unlimited queue: refill it with a Normal load whenever it empties. */
  const feeder = (s: MachineState): MachineState => {
    if (s.queue) return s;
    s = reduce(s, { type: "LOAD_PLACE", place: "queue" });
    return reduce(s, { type: "ADD_TO_RUN", load: at("queue", washPreset("normal")) });
  };

  const unattended = (drawerFull: boolean) => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "010" });
    if (drawerFull) s = reduce(s, { type: "LOAD_PLACE", place: "drawer" });
    s = reduce(s, { type: "START_RUN", input: { loads: [at("washer", washPreset("normal"))], doneBy: null, eco: false } });
    return trace(s, 24 * 60, feeder);
  };

  it("unlimited queue, drawer empty: 2 loads, then stop", () => {
    const t = unattended(false);
    expect(t.dried.size).toBe(2);
    expect(t.washStart.size).toBe(2);
    expect(washerBlock(t.state)).toBe("drawer");
  });

  it("unlimited queue, drawer full: 1 load, then stop", () => {
    const t = unattended(true);
    expect(t.dried.size).toBe(1);
    expect(t.washStart.size).toBe(1);
    expect(washerBlock(t.state)).toBe("drawer");
  });
});

describe("Notify Me chosen", () => {
  const start = () => {
    let s = reduce(machine(), { type: "SET_START_MODE", bits: "011" });
    const first = washPreset("normal");
    first.wash.hangDryNet = true;
    const harsh = washPreset("heavy-duty"); // 0.1 cups bleach counts as harsh
    s = reduce(s, {
      type: "START_RUN",
      input: { loads: [at("washer", first), at("queue", harsh)], doneBy: null, eco: false },
    });
    return s;
  };

  it("pro tip appears at start when the next load is harsh", () => {
    const s = start();
    expect(s.pendingStart).not.toBeNull();
    expect(s.run).toBeNull();
    expect(systemScreen(s)).toBe("pro-tip");
  });

  it("net on, harsh second load, net not cleared: first load dries, second load waits", () => {
    let s = reduce(start(), { type: "PRO_TIP_NOTIFY" });
    const firstId = s.washer!.load.id;
    const secondId = s.queue!.id;
    // Run to the hang-dry window and let the clothes stay in the net.
    let t = trace(s, 60);
    expect(t.state.hangDry).not.toBeNull();
    s = reduce(t.state, { type: "HANG_DRY_SKIP" });
    expect(s.netHasClothes).toBe(true);

    t = trace(s, 12 * 60);
    expect(t.dried.has(firstId)).toBe(true);
    expect(t.state.dryer?.load.id).toBe(firstId);
    // The second load stays in the queue drawer, off the hang-dry clothes in the net.
    expect(t.state.washer).toBeNull();
    expect(t.state.queue?.id).toBe(secondId);
    expect(t.washStart.has(secondId)).toBe(false);
    expect(washerBlock(t.state)).toBe("net");
    expect(t.state.notifications.filter((n) => n.kind === "net-reminder")).toHaveLength(1);

    // Clearing the net releases the second load.
    s = reduce(t.state, { type: "NET_CLEARED" });
    expect(s.washer?.status).toBe("washing");
  });

  it("It's Fine overrides the tip: the second load runs with the net full", () => {
    let s = reduce(start(), { type: "PRO_TIP_FINE" });
    const secondId = s.queue!.id;
    let t = trace(s, 60);
    s = reduce(t.state, { type: "HANG_DRY_SKIP" });
    t = trace(s, 6 * 60);
    expect(t.washStart.has(secondId)).toBe(true);
    expect(t.dried.has(secondId)).toBe(true);
  });
});
