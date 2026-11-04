/**
 * LinkLoad machine — the state machine behind the touchscreen.
 *
 * Plain TypeScript, no React. Everything is a pure function of
 * (state, event) or (state, elapsed time). Components dispatch events and
 * render selectors; they never own timing or transition rules.
 *
 * Two clocks:
 * - simMin: machine time (washes, dries, transfers, Done By). The simulator
 *   speeds this up from 1× to 60×.
 * - realSec: human time (the 30-second hang-dry window, idle sleep). These
 *   are about a person standing at the machine, so they never speed up.
 */
import { applyAutoScan, isHarsh, preScanEstimate } from "./programs";
import {
  canStartWash,
  drawerExitsNeeded,
  planDoneBy,
  planEco,
  staggeredWashStart,
} from "./scheduler";
import type {
  DryerSlot,
  FinishedLoad,
  Load,
  LoadSettings,
  MachineConfig,
  MachineEvent,
  MachineState,
  NotebookBits,
  PlaceId,
  Run,
  RunLoadInput,
  RunWarning,
  StartRunInput,
} from "./types";

const EPS = 1e-6;
const MAX_STEPS = 10_000;

export const DEFAULT_CONFIG: MachineConfig = {
  transferMin: 2,
  drawerDropMin: 1,
  queueDropMin: 1,
  transferAttempts: 3,
  hangDryWindowSec: 30,
  idleSleepSec: 30,
  offPeak: { start: 21 * 60, end: 6 * 60 },
  wakeup: 6 * 60,
  autoUnsureMarginMin: 5,
  finishScreenSec: 8,
};

export function createMachine(opts: { now?: number; config?: Partial<MachineConfig> } = {}): MachineState {
  return {
    now: opts.now ?? 15 * 60,
    config: { ...DEFAULT_CONFIG, ...opts.config },
    sim: { videoEnabled: true, scanOutcome: "confident", failNextTransfer: false },
    queue: null,
    washer: null,
    dryer: null,
    drawer: null,
    transfer: null,
    netHasClothes: false,
    run: null,
    pendingStart: null,
    hangDry: null,
    failure: null,
    finished: [],
    notifications: [],
    ui: { awake: true, idleSec: 0, configuring: null },
    nextId: 1,
  };
}

const clone = (s: MachineState): MachineState => structuredClone(s);

function wake(s: MachineState) {
  s.ui.awake = true;
  s.ui.idleSec = 0;
}

const newLoad = (s: MachineState): Load => ({ id: `L${s.nextId++}`, settings: null, plan: null });

// ── Gates ───────────────────────────────────────────────────────────────────

/**
 * When the dryer can take the next load: its longest likely finish, plus the
 * drop of that load into the done drawer.
 */
export function dryerFreeAt(s: MachineState): number {
  if (s.transfer?.kind === "to-drawer") return s.now + s.transfer.remaining;
  const d = s.dryer;
  if (!d) return s.now;
  const drop = s.config.drawerDropMin;
  switch (d.status) {
    case "finished":
    case "tumbling":
      return s.now + drop;
    case "drying":
    case "paused":
      return s.now + d.remaining + d.margin + drop;
    case "raw":
      // A raw load in the run dries first (rule 3); before the run starts it hasn't begun.
      return d.load.plan ? s.now + (d.load.settings?.dry.minutes ?? 0) + (d.load.settings?.dryMarginMin ?? 0) + drop : Infinity;
  }
}

export type WasherGate =
  | { kind: "none" }
  | { kind: "start" }
  | { kind: "wait"; at: number }
  | { kind: "blocked"; reason: "drawer" | "net" | "dryer" | "not-started" };

/** Whether the load waiting in the washer may start now, later, or is blocked. */
export function washerGate(s: MachineState): WasherGate {
  const w = s.washer;
  if (!w || w.status !== "waiting" || !w.load.plan || !w.load.settings) return { kind: "none" };
  if (!s.run?.started) return { kind: "blocked", reason: "not-started" };
  if (s.run.netBlock && s.netHasClothes && isHarsh(w.load.settings)) return { kind: "blocked", reason: "net" };
  const hold = w.load.holdUntil ?? -Infinity;
  if (w.load.plan === "wash-only") return hold > s.now + EPS ? { kind: "wait", at: hold } : { kind: "start" };
  // Rules 1 and 2.
  if (!canStartWash(s.dryer ? "occupied" : "empty", s.drawer ? "full" : "empty")) {
    return { kind: "blocked", reason: "drawer" };
  }
  const freeAt = dryerFreeAt(s);
  if (!Number.isFinite(freeAt)) return { kind: "blocked", reason: "dryer" };
  // Rules 4 and 5, and any Done By hold.
  const at = Math.max(hold, staggeredWashStart(s.now, w.load.settings.wash.minutes, freeAt));
  return at <= s.now + EPS ? { kind: "start" } : { kind: "wait", at };
}

/**
 * The dry load should drop into the done drawer now: the next wet load is
 * ready, or will be by the time the drop finishes, so it never waits wet.
 */
function drawerDropDue(s: MachineState): boolean {
  const d = s.dryer;
  const w = s.washer;
  if (!d || (d.status !== "finished" && d.status !== "tumbling") || s.drawer || s.transfer || s.failure) return false;
  if (w?.load.plan !== "wash-dry") return false;
  return w.status === "wet" || (w.status === "washing" && w.remaining <= s.config.drawerDropMin + EPS);
}

/** Notify Me was chosen, clothes are in the net, and the queued load is harsh: it stays in the queue drawer. */
export const queueHeldByNet = (s: MachineState): boolean =>
  !s.washer && !!s.run?.netBlock && s.netHasClothes && !!s.queue?.plan && isHarsh(s.queue.settings);

/** A wash-dry load comes after the dryer's current load, so that load will leave for the drawer. */
const laterWashLoad = (s: MachineState) =>
  (!!s.transfer && s.transfer.kind !== "to-drawer" && s.transfer.load.plan === "wash-dry") ||
  (s.washer?.load.plan === "wash-dry" && s.washer.status !== "finished") ||
  s.queue?.plan === "wash-dry";

const washInProgress = (s: MachineState) =>
  !!s.washer && (s.washer.status === "washing" || s.washer.status === "wet") && s.washer.load.plan === "wash-dry";

function runHasWork(s: MachineState): boolean {
  if (s.transfer || s.failure) return true;
  if (s.queue?.plan) return true;
  if (s.washer?.load.plan && s.washer.status !== "finished") return true;
  const d = s.dryer;
  if (d?.load.plan && d.status !== "finished") return true;
  return false;
}

function notifyOnce(s: MachineState, key: string, kind: MachineState["notifications"][number]["kind"], text: string) {
  if (!s.run || s.run.notified.includes(key)) return;
  s.run.notified.push(key);
  s.notifications.push({ at: s.now, kind, text });
}

// ── Settle: apply every transition that is due, until nothing changes ──────

interface SettleOpts {
  /** Forward planning: no human windows, failures or notifications. */
  planning?: boolean;
}

function settle(s: MachineState, opts: SettleOpts = {}): void {
  const cfg = s.config;
  for (let i = 0; i < 100; i++) {
    let changed = false;
    const run = s.run;

    // Run begins (Done By / Eco may have deferred it).
    if (run && !run.started && s.now >= run.startAt - EPS) {
      run.started = true;
      changed = true;
    }

    // Rule 3: a raw load in the dryer dries first.
    if (run?.started && s.dryer?.status === "raw" && s.dryer.load.plan && s.dryer.load.settings) {
      startDrying(s, s.dryer.load);
      changed = true;
    }

    // Moves, one at a time: the dry load into the drawer, then the wet load into the dryer, then the queue into the washer.
    if (drawerDropDue(s)) {
      s.transfer = { kind: "to-drawer", load: s.dryer!.load, remaining: cfg.drawerDropMin, total: cfg.drawerDropMin, attempt: 1 };
      s.dryer = null;
      changed = true;
    }
    if (s.washer?.status === "wet" && !s.dryer && !s.transfer && !s.failure) {
      s.transfer = { kind: "to-dryer", load: s.washer.load, remaining: cfg.transferMin, total: cfg.transferMin, attempt: 1 };
      s.washer = null;
      changed = true;
    }
    // The queue drops into an empty washer once the run has begun and any hang-dry window is done.
    // A harsh load waits in the queue drawer until the hang-dry clothes are out of the net (Notify Me).
    if (queueHeldByNet(s) && !opts.planning) {
      notifyOnce(s, `net:${s.queue!.id}`, "net-reminder", "Take your hang-dry clothes out of the washer.");
    }
    if (!s.washer && s.queue?.plan && s.run?.started && !s.transfer && !s.hangDry && !s.failure && s.queue.settings && !queueHeldByNet(s)) {
      s.transfer = { kind: "to-washer", load: s.queue, remaining: cfg.queueDropMin, total: cfg.queueDropMin, attempt: 1 };
      s.queue = null;
      changed = true;
    }

    // A waiting wash starts when its gate opens.
    const gate = washerGate(s);
    if (gate.kind === "start" && s.washer) {
      s.washer.status = "washing";
      changed = true;
    } else if (gate.kind === "blocked" && s.washer && !opts.planning) {
      const id = s.washer.load.id;
      if (gate.reason === "drawer") {
        notifyOnce(s, `drawer:${id}`, "drawer-full", "Empty the drawer to start your next load.");
      } else if (gate.reason === "net") {
        notifyOnce(s, `net:${id}`, "net-reminder", "Take your hang-dry clothes out of the washer.");
      }
    }

    // Wash finishes.
    if (s.washer?.status === "washing" && s.washer.remaining <= EPS) {
      s.washer.remaining = 0;
      s.washer.status = s.washer.load.plan === "wash-only" ? "finished" : "wet";
      if (s.washer.status === "finished" && !opts.planning) announceFinished(s, s.washer.load, "washer");
      changed = true;
    }

    // A move completes. Only the washer-to-dryer move can fail; it retries, then fails.
    if (s.transfer && s.transfer.remaining <= EPS && s.transfer.kind !== "to-dryer") {
      const t = s.transfer;
      s.transfer = null;
      if (t.kind === "to-drawer") {
        s.drawer = t.load;
        if (!opts.planning) announceFinished(s, t.load, "drawer");
      } else if (t.load.settings) {
        s.washer = { load: t.load, status: "waiting", remaining: t.load.settings.wash.minutes };
      }
      changed = true;
    }
    if (s.transfer?.kind === "to-dryer" && s.transfer.remaining <= EPS) {
      const t = s.transfer;
      if (s.sim.failNextTransfer && !opts.planning) {
        if (t.attempt < cfg.transferAttempts) {
          t.attempt += 1;
          t.remaining = cfg.transferMin;
        } else {
          // Pause, alert, reseal the drum, unlock the door.
          s.transfer = null;
          s.washer = { load: t.load, status: "paused", remaining: 0, pausedFrom: "wet" };
          s.failure = { load: t.load };
          s.sim.failNextTransfer = false;
          s.notifications.push({ at: s.now, kind: "transfer-failed", text: "Your load needs a hand." });
          wake(s);
        }
      } else {
        s.transfer = null;
        startDrying(s, t.load);
        if (t.load.settings?.wash.hangDryNet) {
          s.netHasClothes = true;
          if (!opts.planning) {
            s.hangDry = { secondsLeft: cfg.hangDryWindowSec, unlocked: false };
            wake(s);
          }
        }
      }
      changed = true;
    }

    // Dry finishes. It tumbles while the next wash is under way (rule 5) or until Done By.
    if (s.dryer?.status === "drying" && s.dryer.remaining <= EPS) {
      s.dryer.remaining = 0;
      s.dryer.status = shouldTumble(s) ? "tumbling" : "finished";
      // A load that will drop into the done drawer gets its finish screen when it lands there.
      // (If the drawer is full it may never get there, so announce it in the dryer.)
      if (!opts.planning && (!laterWashLoad(s) || s.drawer)) announceFinished(s, s.dryer.load, "dryer");
      changed = true;
    }
    if (s.dryer?.status === "tumbling" && !shouldTumble(s)) {
      s.dryer.status = "finished";
      changed = true;
    }

    // Run ends when nothing is left to do.
    if (s.run && !runHasWork(s)) {
      s.run = null;
      changed = true;
    }

    if (!changed) return;
  }
}

/** Queue the finish screen for a load that just completed, once per load. */
function announceFinished(s: MachineState, load: Load, place: FinishedLoad["place"]) {
  if (load.announced) return;
  load.announced = true;
  s.finished.push({
    loadId: load.id,
    program: load.settings?.program ?? "normal",
    label: load.settings?.label ?? "Load",
    place,
    tumbleUntil: place === "dryer" && s.dryer?.status === "tumbling" ? (s.run?.doneBy ?? null) : null,
    secondsLeft: s.config.finishScreenSec,
  });
  wake(s);
}

function shouldTumble(s: MachineState): boolean {
  if (washInProgress(s)) return true;
  // Only the last load tumbles until Done By; an earlier one waits finished for its move to the drawer.
  const doneBy = s.run?.doneBy;
  return !laterWashLoad(s) && doneBy != null && s.now < doneBy - EPS && !!s.dryer?.load.plan;
}

function startDrying(s: MachineState, load: Load) {
  const st = load.settings;
  const slot: DryerSlot = {
    load,
    status: "drying",
    remaining: st?.dry.minutes ?? 0,
    margin: st?.dryMarginMin ?? 0,
  };
  s.dryer = slot;
}

/** Minutes until the next machine-time transition, or Infinity. */
function nextEventIn(s: MachineState): number {
  const c: number[] = [];
  if (s.run && !s.run.started) c.push(s.run.startAt - s.now);
  if (s.washer?.status === "washing") {
    c.push(s.washer.remaining);
    // The dry load drops into the drawer just in time for the wash to end.
    if (s.dryer && (s.dryer.status === "finished" || s.dryer.status === "tumbling")) c.push(s.washer.remaining - s.config.drawerDropMin);
  }
  const gate = washerGate(s);
  if (gate.kind === "wait") c.push(gate.at - s.now);
  if (s.transfer) c.push(s.transfer.remaining);
  if (s.dryer?.status === "drying") c.push(s.dryer.remaining);
  if (s.dryer?.status === "tumbling" && s.run?.doneBy != null) c.push(s.run.doneBy - s.now);
  const positive = c.filter((x) => x > EPS);
  return positive.length ? Math.min(...positive) : Infinity;
}

function advance(s: MachineState, dt: number) {
  s.now += dt;
  if (s.washer?.status === "washing") s.washer.remaining -= dt;
  if (s.dryer?.status === "drying") s.dryer.remaining -= dt;
  if (s.transfer) s.transfer.remaining -= dt;
}

// ── Time ────────────────────────────────────────────────────────────────────

/** Advance both clocks. Steps exactly to each transition so timestamps stay exact. */
export function tick(
  state: MachineState,
  /** windowSec: how far the hang-dry countdown moves; the simulator speeds it up (defaults to realSec). */
  elapsed: { simMin?: number; realSec?: number; windowSec?: number },
): MachineState {
  const s = clone(state);
  const realSec = elapsed.realSec ?? 0;

  if (realSec > 0) {
    if (s.hangDry && !s.hangDry.unlocked) {
      s.hangDry.secondsLeft -= elapsed.windowSec ?? realSec;
      // Timeout behaves like Skip: the clothes stay in the net.
      if (s.hangDry.secondsLeft <= 0) s.hangDry = null;
    }
    // The finish screen returns to the main page on its own; it waits out a transfer.
    const head = s.finished[0];
    if (head && !s.transfer) {
      head.secondsLeft -= realSec;
      if (head.secondsLeft <= 0) s.finished.shift();
    }
    s.ui.idleSec += realSec;
    // Nobody is there: sleep. Anything being set up stays as it was.
    if (s.ui.awake && s.ui.idleSec >= s.config.idleSleepSec && !needsAttention(s)) s.ui.awake = false;
  }

  settle(s);
  let left = elapsed.simMin ?? 0;
  for (let i = 0; left > EPS && i < MAX_STEPS; i++) {
    const dt = Math.min(left, nextEventIn(s));
    advance(s, dt);
    left -= dt;
    settle(s);
  }
  return s;
}

// ── Planning (forward simulation) ──────────────────────────────────────────

export interface Projection {
  /** Absolute longest-likely finish of everything planned. */
  finishAt: number;
  /** The run stalls before finishing, waiting on the drawer. */
  blockedByDrawer: boolean;
  /** Stalled for another reason (net block, raw load in the dryer). */
  stalled: boolean;
}

/** Run a copy of the machine forward with nobody around and report when it finishes. */
export function project(state: MachineState): Projection {
  const p = clone(state);
  p.sim.failNextTransfer = false;
  p.hangDry = null;
  let finishAt = p.now;
  const note = () => {
    finishAt = Math.max(finishAt, p.now);
    if (p.dryer?.status === "drying" || p.dryer?.status === "paused") {
      finishAt = Math.max(finishAt, p.now + p.dryer.remaining + p.dryer.margin);
    }
  };
  settle(p, { planning: true });
  note();
  for (let i = 0; p.run && i < MAX_STEPS; i++) {
    const dt = nextEventIn(p);
    if (!Number.isFinite(dt)) break;
    advance(p, dt);
    settle(p, { planning: true });
    note();
  }
  const gate = washerGate(p);
  const blockedByDrawer = gate.kind === "blocked" && gate.reason === "drawer";
  const stalled = !!p.run;
  if (p.run?.doneBy != null) finishAt = Math.max(finishAt, p.run.doneBy);
  return { finishAt, blockedByDrawer, stalled };
}

/** Put the run's loads in place with their settings, without starting anything. */
function placeLoads(s: MachineState, loads: RunLoadInput[], scan: (l: RunLoadInput) => LoadSettings) {
  for (const l of loads) {
    const settings = scan(l);
    if (l.place === "queue") {
      s.queue ??= newLoad(s);
      Object.assign(s.queue, { settings, plan: l.plan });
    } else if (l.place === "washer") {
      const load = s.washer?.load ?? newLoad(s);
      Object.assign(load, { settings, plan: l.plan });
      s.washer = { load, status: "waiting", remaining: settings.wash.minutes };
    } else {
      const load = s.dryer?.load ?? newLoad(s);
      Object.assign(load, { settings, plan: l.plan });
      s.dryer = { load, status: "raw", remaining: settings.dry.minutes, margin: settings.dryMarginMin };
    }
  }
}

const emptyRun = (startAt: number): Run => ({
  startAt,
  started: false,
  doneBy: null,
  eco: false,
  netBlock: false,
  warnings: [],
  notified: [],
});

function runWarnings(s: MachineState, input: StartRunInput): RunWarning[] {
  const washLoads = input.loads.filter((l) => l.plan === "wash-dry");
  const exits = drawerExitsNeeded(!!s.dryer, washLoads.length);
  const capacity = s.drawer ? 0 : 1;
  if (exits <= capacity) return [];
  const w: RunWarning[] = [];
  // Order through the machine: washer first, then queue.
  const ordered = [...washLoads].sort((a, b) => (a.place === "washer" ? -1 : 0) - (b.place === "washer" ? -1 : 0));
  const blocked = ordered.slice(ordered.length - (exits - capacity));
  for (const l of blocked) {
    const id = l.place === "queue" ? s.queue?.id : s.washer?.load.id;
    w.push({ kind: "needs-drawer", loadId: id ?? l.place });
  }
  if (input.doneBy != null) w.push({ kind: "drawer-blocks-done-by" });
  return w;
}

export interface RunPreview {
  durationMin: number;
  startAt: number;
  finishAt: number;
  /** Done By (or Eco) can be met. */
  feasible: boolean;
  /** Rule 7: earliest possible finish when the deadline can't be met. */
  earliestFinish: number;
  /** Rule 6 / 8 warnings. */
  warnings: RunWarning[];
  blockedByDrawer: boolean;
  /** Pro tip will appear at start. */
  proTip: boolean;
  /** What has to be emptied before these loads can all run. */
  clearance: Clearance;
}

/**
 * What the screen shows before Start or Set: start time, finish, warnings.
 * Uses the pre-scan estimate for Auto, since the scan runs after start.
 */
export function previewRun(state: MachineState, input: StartRunInput): RunPreview {
  const s = clone(state);
  placeLoads(s, input.loads, (l) => preScanEstimate(l.settings, s.config));
  if (!state.run) return { ...planInPlace(s, input, state), clearance: clearance(s) };
  // Joining a run already going, e.g. a wash set up while a Dry Only load dries.
  const plan = planJoin(s, input);
  return {
    durationMin: plan.earliestFinish - s.now,
    startAt: plan.hold ?? s.now,
    finishAt: plan.finishAt,
    feasible: plan.feasible,
    earliestFinish: plan.earliestFinish,
    warnings: runWarnings(state, input),
    blockedByDrawer: project(s).blockedByDrawer,
    proTip: proTipLoad(state, input) != null,
    clearance: clearance(s),
  };
}

interface JoinPlan {
  holdId: string | null;
  hold: number | null;
  finishAt: number;
  feasible: boolean;
  earliestFinish: number;
}

/**
 * Done By / Eco for loads joining a running run. The dryer may already be
 * busy, so a plain time shift isn't exact: search for the latest wash start
 * whose projected finish still meets the deadline.
 */
function planJoin(placed: MachineState, input: StartRunInput): JoinPlan {
  const now = placed.now;
  const first = input.loads.find((l) => l.place === "washer" && l.plan !== "dry-only")
    ?? input.loads.find((l) => l.place === "queue");
  const holdId = first ? (first.place === "washer" ? placed.washer?.load.id : placed.queue?.id) ?? null : null;

  const finishWith = (hold: number | null) => {
    const p = clone(placed);
    if (p.run) p.run.doneBy = null;
    const load = p.washer?.load.id === holdId ? p.washer?.load : p.queue?.id === holdId ? p.queue : null;
    if (load && hold != null) load.holdUntil = hold;
    return project(p).finishAt;
  };

  const earliestFinish = finishWith(null);
  const none = { holdId, hold: null, finishAt: earliestFinish, earliestFinish };
  if (input.doneBy == null && !input.eco) return { ...none, feasible: true };

  const cfg = placed.config;
  const deadline = input.eco
    ? planEco(now, earliestFinish - now, input.doneBy, cfg.offPeak, cfg.wakeup).finishAt
    : input.doneBy!;
  if (!holdId || earliestFinish > deadline + EPS) return { ...none, feasible: earliestFinish <= deadline + EPS };

  // Latest whole-minute hold that still finishes by the deadline. Finish only grows with the hold.
  let lo = Math.ceil(now);
  let hi = Math.floor(deadline);
  if (finishWith(lo) > deadline + EPS) return { ...none, feasible: true };
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (finishWith(mid) <= deadline + EPS) lo = mid;
    else hi = mid - 1;
  }
  return { holdId, hold: lo, finishAt: deadline, feasible: true, earliestFinish };
}

function planInPlace(placed: MachineState, input: StartRunInput, original: MachineState): Omit<RunPreview, "clearance"> {
  const probe = clone(placed);
  probe.run = emptyRun(probe.now);
  const proj = project(probe);
  const durationMin = proj.finishAt - placed.now;
  const now = placed.now;
  const cfg = placed.config;
  const plan = input.eco
    ? planEco(now, durationMin, input.doneBy, cfg.offPeak, cfg.wakeup)
    : input.doneBy != null
      ? planDoneBy(now, durationMin, input.doneBy)
      : { feasible: true, startAt: now, finishAt: now + durationMin, earliestFinish: now + durationMin };
  return {
    durationMin,
    startAt: plan.startAt,
    finishAt: plan.finishAt,
    feasible: plan.feasible,
    earliestFinish: plan.earliestFinish,
    warnings: runWarnings(original, input),
    blockedByDrawer: proj.blockedByDrawer,
    proTip: proTipLoad(original, input) != null,
  };
}

/**
 * Pro tip trigger: a harsh load follows hang-dry clothes, either already in
 * the net or from an earlier load in this run with the net on.
 */
function proTipLoad(s: MachineState, input: StartRunInput): RunLoadInput | null {
  const order = { washer: 0, queue: 1, dryer: 2 } as const;
  const washes = input.loads.filter((l) => l.plan !== "dry-only").sort((a, b) => order[a.place] - order[b.place]);
  let net = s.netHasClothes || !!s.washer?.load.settings?.wash.hangDryNet && s.washer.load.plan != null;
  for (const l of washes) {
    if (net && isHarsh(preScanEstimate(l.settings, s.config))) return l;
    if (l.settings.wash.hangDryNet) net = true;
  }
  return null;
}

/** The Auto scan as it runs at start, honoring the video switch. */
const scanAtStart = (s: MachineState) => (l: RunLoadInput) =>
  applyAutoScan(l.settings, s.sim.videoEnabled ? s.sim.scanOutcome : "fail", s.config, l.plan === "dry-only");

function beginRun(s: MachineState, input: StartRunInput, netBlock: boolean) {
  s.ui.configuring = null;
  if (s.run) {
    joinRun(s, input, netBlock);
    return;
  }
  const warnings = runWarnings(s, input);
  placeLoads(s, input.loads, scanAtStart(s));
  // Plan against the scanned settings.
  const preview = planInPlace(s, input, s);
  s.run = {
    ...emptyRun(preview.startAt),
    // The last load tumbles until the planned finish (the Done By time when set).
    doneBy: input.doneBy != null || input.eco ? preview.finishAt : null,
    eco: input.eco,
    netBlock,
    warnings,
  };
}

/** Loads set up while a run is going join it. Done By / Eco hold their wash start. */
function joinRun(s: MachineState, input: StartRunInput, netBlock: boolean) {
  const run = s.run!;
  run.warnings.push(...runWarnings(s, input));
  placeLoads(s, input.loads, scanAtStart(s));
  if (netBlock) run.netBlock = true;
  if (input.doneBy == null && !input.eco) return;
  const plan = planJoin(s, input);
  const load = s.washer?.load.id === plan.holdId ? s.washer?.load : s.queue?.id === plan.holdId ? s.queue : null;
  if (load && plan.hold != null) load.holdUntil = plan.hold;
  run.doneBy = plan.finishAt;
  run.eco = input.eco;
}

const addToRun = (s: MachineState, load: RunLoadInput, netBlock: boolean) =>
  beginRun(s, { loads: [load], doneBy: null, eco: false }, netBlock);

// ── Events ──────────────────────────────────────────────────────────────────

const USER_EVENTS = new Set<MachineEvent["type"]>([
  "START_RUN", "PRO_TIP_FINE", "PRO_TIP_NOTIFY", "ADD_TO_RUN", "HANG_DRY_YES", "HANG_DRY_SKIP",
  "HANG_DRY_RESUME", "PAUSE", "RESUME", "CANCEL", "SET_DRY_MINUTES", "SET_DRYER_SHEETS", "RESUME_AFTER_FAILURE",
  // CONFIGURE_END is left out: it also fires when the screen sleeps mid-setup.
  "TOUCH", "APPROACH", "LOAD_PLACE", "EMPTY_PLACE", "NET_CLEARED", "CONFIGURE", "FINISH_OK",
]);

export function reduce(state: MachineState, event: MachineEvent): MachineState {
  const s = clone(state);
  if (USER_EVENTS.has(event.type)) wake(s);

  switch (event.type) {
    case "START_RUN": {
      if (s.pendingStart) break;
      const harsh = proTipLoad(s, event.input);
      if (harsh) {
        s.pendingStart = { mode: "start", input: event.input, harshPlace: harsh.place };
        break;
      }
      beginRun(s, event.input, false);
      break;
    }
    case "ADD_TO_RUN": {
      if (s.pendingStart) break;
      const input = { loads: [event.load], doneBy: null, eco: false };
      const harsh = proTipLoad(s, input);
      if (harsh) {
        s.pendingStart = { mode: "add", input, harshPlace: harsh.place };
        break;
      }
      addToRun(s, event.load, false);
      break;
    }
    case "PRO_TIP_FINE":
    case "PRO_TIP_NOTIFY": {
      const p = s.pendingStart;
      if (!p) break;
      s.pendingStart = null;
      const block = event.type === "PRO_TIP_NOTIFY";
      if (p.mode === "start") beginRun(s, p.input, block);
      else addToRun(s, p.input.loads[0], block);
      break;
    }
    case "HANG_DRY_YES":
      if (s.hangDry) s.hangDry.unlocked = true;
      break;
    case "HANG_DRY_RESUME":
      if (s.hangDry?.unlocked) {
        s.netHasClothes = false;
        s.hangDry = null;
      }
      break;
    case "FINISH_OK":
      s.finished.shift();
      break;
    case "HANG_DRY_SKIP":
      s.hangDry = null;
      break;
    case "NET_CLEARED":
      s.netHasClothes = false;
      break;

    case "PAUSE": {
      // Anyone can pause, e.g. to take hang-dry clothes out outside the window.
      const w = s.washer;
      const d = s.dryer;
      if (event.place === "washer" && w && (w.status === "washing" || w.status === "waiting" || w.status === "wet")) {
        w.pausedFrom = w.status;
        w.status = "paused";
      }
      if (event.place === "dryer" && d && (d.status === "drying" || d.status === "tumbling")) {
        d.pausedFrom = d.status;
        d.status = "paused";
      }
      break;
    }
    case "RESUME": {
      if (s.failure) break;
      const w = s.washer;
      const d = s.dryer;
      if (event.place === "washer" && w?.status === "paused" && w.pausedFrom) {
        w.status = w.pausedFrom;
        w.pausedFrom = undefined;
      }
      if (event.place === "dryer" && d?.status === "paused" && d.pausedFrom) {
        d.status = d.pausedFrom;
        d.pausedFrom = undefined;
      }
      break;
    }
    case "CANCEL": {
      // Spec: Pause, then Cancel. The load stays where it is, out of the run.
      const slot = event.place === "washer" ? s.washer : s.dryer;
      if (slot?.status !== "paused" || s.failure) break;
      slot.load.plan = null;
      slot.status = "raw";
      slot.pausedFrom = undefined;
      break;
    }
    case "SET_DRY_MINUTES": {
      const minutes = Math.max(0, event.minutes);
      if (event.place === "dryer" && s.dryer?.load.settings) {
        const st = s.dryer.load.settings;
        const elapsed = st.dry.minutes - s.dryer.remaining;
        st.dry.minutes = minutes;
        s.dryer.remaining = Math.max(0, minutes - elapsed);
        if (s.dryer.status === "finished" && s.dryer.remaining > 0) s.dryer.status = "drying";
      } else if (event.place === "washer" && s.washer?.load.settings) {
        s.washer.load.settings.dry.minutes = minutes;
      }
      break;
    }
    case "SET_DRYER_SHEETS": {
      const st = event.place === "dryer" ? s.dryer?.load.settings : s.washer?.load.settings;
      if (st) st.dry.dryerSheets = Math.max(0, Math.round(event.sheets));
      break;
    }
    case "RESUME_AFTER_FAILURE": {
      // The user moved the load into the dryer by hand.
      const f = s.failure;
      if (!f) break;
      s.failure = null;
      s.washer = null;
      startDrying(s, f.load);
      if (f.load.settings?.wash.hangDryNet) s.netHasClothes = true;
      break;
    }

    case "TOUCH":
    case "APPROACH":
      break;

    case "CONFIGURE":
      s.ui.configuring = { place: event.place, kind: event.kind };
      break;
    case "CONFIGURE_END":
      s.ui.configuring = null;
      break;

    case "LOAD_PLACE": {
      const load = newLoad(s);
      if (placeToggle(s, event.place) !== "load") break;
      if (event.place === "queue" && !s.queue) s.queue = load;
      else if (event.place === "washer" && !s.washer && !s.transfer) {
        s.washer = { load, status: "raw", remaining: 0 };
      } else if (event.place === "dryer" && !s.dryer && !s.transfer) {
        s.dryer = { load, status: "raw", remaining: 0, margin: 0 };
      } else if (event.place === "drawer" && !s.drawer) s.drawer = load;
      break;
    }
    case "EMPTY_PLACE": {
      // Emptying the drawer is the real user action; the rest are simulator shortcuts.
      if (event.place === "drawer") s.drawer = null;
      if (event.place === "queue") s.queue = null;
      if (event.place === "washer" && !s.failure) s.washer = null;
      if (event.place === "dryer") s.dryer = null;
      break;
    }

    case "SET_START_MODE": {
      const fresh = createMachine({ now: s.now, config: s.config });
      fresh.sim = { ...s.sim, failNextTransfer: false };
      fresh.nextId = s.nextId;
      const [d, w, q] = event.bits.split("").map((b) => b === "1");
      if (d) fresh.dryer = { load: newLoad(fresh), status: "raw", remaining: 0, margin: 0 };
      if (w) fresh.washer = { load: newLoad(fresh), status: "raw", remaining: 0 };
      if (q) fresh.queue = newLoad(fresh);
      return fresh;
    }
    case "FORCE_TRANSFER_FAIL":
      s.sim.failNextTransfer = true;
      break;
    case "DRY_OVERRUN":
      if (s.dryer?.status === "drying") s.dryer.remaining += Math.max(0, event.minutes);
      break;
    case "SET_SCAN_OUTCOME":
      s.sim.scanOutcome = event.outcome;
      break;
    case "SET_VIDEO":
      s.sim.videoEnabled = event.enabled;
      break;
    case "SET_TIME":
      s.now = event.now;
      break;
  }

  settle(s);
  return s;
}

// ── Selectors ───────────────────────────────────────────────────────────────

/** Something needs a person at the screen, so it stays awake. */
export function needsAttention(s: MachineState): boolean {
  return !!(s.hangDry || s.failure || s.pendingStart);
}

/**
 * The simulator slows down while this is true: the hang-dry window is a
 * 30-second human countdown, and the next load can't drop in until it ends.
 */
export const holdRealTime = (s: MachineState): boolean => !!s.hangDry;

/**
 * Notebook three-bit mode, dryer-washer-queue. A bit is set only when that
 * place holds a raw load that isn't part of a run.
 */
export function notebookBits(s: MachineState): NotebookBits {
  const d = s.dryer?.status === "raw" && !s.dryer.load.plan;
  const w = s.washer?.status === "raw" && !s.washer.load.plan;
  const q = !!s.queue && !s.queue.plan;
  return `${+d}${+w}${+q}` as NotebookBits;
}

/** When the waiting wash in the washer is due to start, if it is counting down. */
export function washerStartsAt(s: MachineState): number | null {
  if (s.run && !s.run.started && s.washer?.status === "waiting") return s.run.startAt;
  const g = washerGate(s);
  return g.kind === "wait" ? g.at : null;
}

/** Remaining time for the whole run, as shown on Sleep. */
export function runRemaining(s: MachineState): number | null {
  if (!s.run) return null;
  return Math.max(0, project(s).finishAt - s.now);
}

/**
 * Soft purple LEDs inside the machine. The place whose load is being
 * configured on screen lights up; wash and dry look the same.
 */
export function leds(s: MachineState): Record<"queue" | "washer" | "dryer", boolean> {
  const c = s.ui.configuring?.place;
  return { queue: c === "queue", washer: c === "washer", dryer: c === "dryer" };
}

/**
 * What a tap on a place in the machine view does: put clothes in, take them
 * out, or nothing while the load is part of a running cycle.
 */
export function placeToggle(s: MachineState, place: PlaceId): "load" | "empty" | null {
  switch (place) {
    case "queue":
      if (s.transfer?.kind === "to-washer") return null;
      return !s.queue ? "load" : !s.queue.plan ? "empty" : null;
    case "washer":
      if (!s.washer) return s.transfer ? null : "load";
      return s.washer.status === "raw" || s.washer.status === "finished" ? "empty" : null;
    case "dryer":
      if (!s.dryer) return s.transfer ? null : "load";
      // Dry clothes can come out any time, including while tumbling.
      return (s.dryer.status === "raw" && !s.dryer.load.plan) || s.dryer.status === "finished" || s.dryer.status === "tumbling"
        ? "empty"
        : null;
    case "drawer":
      if (s.transfer?.kind === "to-drawer") return null;
      return s.drawer ? "empty" : "load";
  }
}

export interface Clearance {
  /** What to empty, in the order to ask for it. */
  places: ("dryer" | "drawer")[];
  /** Loads still short of a drawer slot after that (the unattended limit, rule 8). */
  residual: number;
}

/**
 * What has to be emptied so every wash load in (or about to join) the run can
 * reach the dryer. Each wash load that isn't the last one pushes the dryer's
 * load into the done drawer, so the drawer needs a free slot per push.
 * Emptying a dryer holding a finished load removes a push; emptying the
 * drawer adds a slot. A dryer that is still drying can't be emptied.
 */
export function clearance(s: MachineState): Clearance {
  const t = s.transfer;
  const pending =
    (s.washer?.load.plan === "wash-dry" && s.washer.status !== "finished" ? 1 : 0) +
    (s.queue?.plan === "wash-dry" ? 1 : 0) +
    (t?.kind === "to-washer" && t.load.plan === "wash-dry" ? 1 : 0);
  if (pending === 0) return { places: [], residual: 0 };
  const exits = drawerExitsNeeded(!!s.dryer || t?.kind === "to-dryer", pending);
  let deficit = exits - (s.drawer || t?.kind === "to-drawer" ? 0 : 1);
  const places: Clearance["places"] = [];
  if (deficit > 0 && s.dryer && placeToggle(s, "dryer") === "empty") {
    places.push("dryer");
    deficit--;
  }
  if (deficit > 0 && s.drawer) {
    places.push("drawer");
    deficit--;
  }
  return { places, residual: Math.max(0, deficit) };
}

/** Why the washer can't start, for the Drawer prompt. */
export function washerBlock(s: MachineState): "drawer" | "net" | null {
  if (queueHeldByNet(s)) return "net";
  const g = washerGate(s);
  return g.kind === "blocked" && (g.reason === "drawer" || g.reason === "net") ? g.reason : null;
}
