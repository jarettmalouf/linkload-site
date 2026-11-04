/**
 * Moves between places take machine time and run one at a time: the dry
 * load drops into the done drawer, then the wet load moves into the dryer,
 * then the queued load drops into the washer.
 */
import { describe, expect, it } from "vitest";
import { createApp, effectiveSpeed, step } from "../app";
import { tick } from "../machine";
import { washPreset } from "../programs";
import type { MachineState, TransferKind } from "../types";
import { washerTile } from "../view";
import { at, machine, pm, reduce, times } from "./helpers";

/** Every move, in order, with when it started. */
function moves(s: MachineState, minutes: number) {
  const seen: { kind: TransferKind; load: string; at: number }[] = [];
  let last: string | null = null;
  for (let i = 0; i < minutes * 4; i++) {
    s = tick(s, { simMin: 0.25 });
    const t = s.transfer;
    const key = t ? `${t.kind}:${t.load.id}` : null;
    if (t && key !== last) seen.push({ kind: t.kind, load: t.load.id, at: s.now });
    last = key;
  }
  return { seen, state: s };
}

describe("Moves between places", () => {
  const twoLoads = (doneBy: number | null = null) => {
    let s = reduce(machine(pm(0), true), { type: "SET_START_MODE", bits: "011" });
    const ids = { first: s.washer!.load.id, second: s.queue!.id };
    s = reduce(s, {
      type: "START_RUN",
      input: { loads: [at("washer", times(45, 55)), at("queue", times(40, 40))], doneBy, eco: false },
    });
    return { s, ids };
  };

  it("run one at a time: to the dryer, queue to the washer, dry load to the drawer, then to the dryer", () => {
    const { s, ids } = twoLoads();
    const { seen, state } = moves(s, 5 * 60);
    expect(seen.map((m) => [m.kind, m.load])).toEqual([
      ["to-dryer", ids.first],
      ["to-washer", ids.second],
      ["to-drawer", ids.first],
      ["to-dryer", ids.second],
    ]);
    // Wash 45, transfer 2, dry 55, drop 1: the drop starts at 1:42 and the second transfer right after.
    expect(seen[2].at - pm(0)).toBeCloseTo(102, 5);
    expect(seen[3].at - pm(0)).toBeCloseTo(103, 5);
    expect(state.drawer?.id).toBe(ids.first);
    expect(state.dryer?.load.id).toBe(ids.second);
  });

  it("the second wash is staggered so it ends as the dry load lands in the drawer: no wet wait", () => {
    const { s, ids } = twoLoads();
    let m = tick(s, { simMin: 48 }); // past the first transfer and the queue drop
    expect(m.washer?.load.id).toBe(ids.second);
    expect(m.washer?.status).toBe("waiting");
    // The dry ends at 1:42 and the drop at 1:43; a 40-minute wash starts at 1:03, 15 minutes from now.
    expect(washerTile(m)).toMatchObject({ status: "Waiting", big: "0:15" });
    m = tick(m, { simMin: 15 });
    expect(m.washer?.status).toBe("washing");
    m = tick(m, { simMin: 40 });
    expect(m.transfer?.kind).toBe("to-dryer");
  });

  it("Done By still finishes exactly on time with the drops counted", () => {
    const { s } = twoLoads(pm(6, 30));
    const end = tick(s, { simMin: 9 * 60 });
    expect(end.run).toBeNull();
    // 45 wash + 2 transfer + 55 dry + 1 drop + 2 transfer + 40 dry = 145 minutes, ending at 6:30.
    // (The queue drop fits in the stagger, so it adds nothing.)
    expect(s.run!.startAt).toBe(pm(6, 30) - 145);
  });

  it("moves run at 24x in the simulator: the transfer takes 5 real seconds", () => {
    let s = step(createApp("010"), { type: "WELCOME" });
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    s = step(s, { type: "START" });
    expect(effectiveSpeed(s, 60)).toBe(60);
    s = { ...s, machine: tick(s.machine, { simMin: 45.5 }) };
    expect(s.machine.transfer?.kind).toBe("to-dryer");
    expect(effectiveSpeed(s, 60)).toBe(24); // 2 minutes in 5 seconds
  });

  it("two Auto loads stagger, since an Auto dry runs longer than its wash", () => {
    let s = step(createApp("011"), { type: "WELCOME" });
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = step(s, { type: "START" });
    const auto = washPreset("auto");
    expect(auto.dry.minutes).toBeGreaterThan(auto.wash.minutes);
    s = { ...s, machine: tick(s.machine, { simMin: 48 }) };
    // The dry ends at 1:42 and drops by 1:43, so the 45-minute wash waits until 12:58: 10 minutes.
    expect(washerTile(s.machine)).toMatchObject({ status: "Waiting", big: "0:10" });
  });
});

describe("Hang-dry window in the simulator", () => {
  it("runs at 10x, so its 30 seconds take 3", () => {
    let s = step(createApp("010"), { type: "WELCOME" });
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    const st = s.draft!.loads[0].settings;
    s = step(s, { type: "EDIT", settings: { ...st, wash: { ...st.wash, hangDryNet: true } } });
    s = step(s, { type: "START" });
    s = { ...s, machine: tick(s.machine, { simMin: 47.01 }) }; // wash 45, transfer 2
    expect(s.machine.hangDry).not.toBeNull();
    expect(effectiveSpeed(s, 60)).toBe(10);
    s = step(s, { type: "TICK", realSec: 2.9, speed: 60 });
    expect(s.machine.hangDry?.secondsLeft).toBeCloseTo(1, 1);
    s = step(s, { type: "TICK", realSec: 0.2, speed: 60 });
    expect(s.machine.hangDry).toBeNull();
    // At 1x it's a real 30 seconds.
    expect(effectiveSpeed({ ...s, machine: { ...s.machine, hangDry: { secondsLeft: 30, unlocked: false } } }, 1)).toBe(1);
  });
});
