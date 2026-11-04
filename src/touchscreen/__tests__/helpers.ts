import { createMachine, reduce, tick } from "../machine";
import { washPreset } from "../programs";
import type { LoadPlan, LoadSettings, MachineState, RunLoadInput, WashProgramId } from "../types";

/** Absolute minute for a PM clock time on day 0, e.g. pm(3, 31) = 3:31 PM. */
export const pm = (h: number, m = 0) => (12 + h) * 60 + m;

/** A load with explicit wash, dry and margin minutes. */
export function times(wash: number, dry: number, margin = 0, program: WashProgramId = "normal"): LoadSettings {
  const s = washPreset(program);
  s.wash.minutes = wash;
  s.dry.minutes = dry;
  s.dryMarginMin = margin;
  return s;
}

export const at = (place: RunLoadInput["place"], settings: LoadSettings, plan: LoadPlan = "wash-dry"): RunLoadInput => ({
  place,
  settings,
  plan,
});

/**
 * Fresh machine at noon with no idle sleep getting in the way. Drops into the
 * drawer and washer are instant, as in the notebook, unless `drops` is set.
 */
export function machine(now = pm(0), drops = false): MachineState {
  return createMachine({ now, config: { idleSleepSec: 1e9, ...(drops ? {} : { drawerDropMin: 0, queueDropMin: 0 }) } });
}

export interface Trace {
  /** First minute each load id was seen washing. */
  washStart: Map<string, number>;
  /** First minute each load id was seen out of `washing` after washing. */
  washEnd: Map<string, number>;
  /** First minute each load id was seen moving from the washer to the dryer. */
  transferStart: Map<string, number>;
  /** First minute each load id was seen drying. */
  dryStart: Map<string, number>;
  /** Load ids that reached the dryer and finished drying. */
  dried: Set<string>;
  state: MachineState;
}

/**
 * Step a minute at a time and record when things happen. The machine steps
 * exactly to each transition, and all inputs are whole minutes, so
 * minute-boundary observations are exact.
 */
export function trace(
  start: MachineState,
  minutes: number,
  each?: (s: MachineState) => MachineState,
): Trace {
  const t: Trace = {
    washStart: new Map(),
    washEnd: new Map(),
    transferStart: new Map(),
    dryStart: new Map(),
    dried: new Set(),
    state: start,
  };
  let s = start;
  const observe = () => {
    const w = s.washer;
    for (const [id] of t.washStart) {
      if (!t.washEnd.has(id) && !(w?.load.id === id && (w.status === "washing" || w.status === "paused"))) {
        t.washEnd.set(id, s.now);
      }
    }
    if (w?.status === "washing" && !t.washStart.has(w.load.id)) t.washStart.set(w.load.id, s.now);
    if (s.transfer?.kind === "to-dryer" && !t.transferStart.has(s.transfer.load.id)) t.transferStart.set(s.transfer.load.id, s.now);
    const d = s.dryer;
    if (d?.status === "drying" && !t.dryStart.has(d.load.id)) t.dryStart.set(d.load.id, s.now);
    if (d && (d.status === "finished" || d.status === "tumbling") && t.dryStart.has(d.load.id)) t.dried.add(d.load.id);
    // A load that dried and already left for the drawer counts too.
    if (s.drawer && t.dryStart.has(s.drawer.id)) t.dried.add(s.drawer.id);
  };
  observe();
  for (let i = 0; i < minutes; i++) {
    if (each) s = each(s);
    s = tick(s, { simMin: 1 });
    observe();
  }
  t.state = s;
  return t;
}

export { reduce, tick };
