/**
 * App layer: the machine plus on-screen navigation. Pure, no React.
 *
 * Navigation (which setup screen is open, the draft being edited) lives here
 * so the components only render state and dispatch actions.
 */
import { createMachine, holdRealTime, previewRun, reduce, tick, type RunPreview } from "./machine";
import { DRY_PICKER_ORDER, WASH_PICKER_ORDER, presetOf } from "./programs";
import { clockLabel, nextOccurrence, timeOfDay } from "./scheduler";
import { baseScreen, overlayScreen, pickerTarget, type SetupIntent } from "./screens";
import type { LoadPlan, LoadSettings, MachineEvent, MachineState, NotebookBits, ProgramId, StartRunInput } from "./types";

export type NavScreen = "setup" | "advanced" | "done-by" | "wash-detail" | "dry-detail";

export interface DraftLoad {
  target: { place: "washer" | "queue" | "dryer"; kind: "wash" | "dry" };
  program: ProgramId;
  settings: LoadSettings;
}


export interface Draft {
  intent: SetupIntent;
  /** Loads set up together; one Start starts them all. */
  loads: DraftLoad[];
  /** The load the picker is editing; its place's LED is lit. */
  active: number;
  timing: {
    /** Finish at a set time. The time picker shows only while this is on. */
    doneBy: boolean;
    /**
     * Cheapest energy window. Alone: the cheapest window that finishes by the
     * morning wake-up. With Done By: the cheapest window before that time.
     */
    eco: boolean;
    /** Done By time, minutes past midnight. */
    time: number;
  };
}

export interface AppState {
  machine: MachineState;
  nav: NavScreen[];
  draft: Draft | null;
  /** Info sheet open on the Done By screen. */
  info: "eco" | "done-by" | null;
  /** Past the welcome screen since the screen last woke. */
  welcomed: boolean;
}

export type AppAction =
  | { type: "MACHINE"; event: MachineEvent }
  | { type: "TICK"; realSec: number; speed: number }
  | { type: "WELCOME" }
  | { type: "OPEN_SETUP"; intent: SetupIntent }
  | { type: "PICK"; program: ProgramId }
  | { type: "EDIT"; settings: LoadSettings }
  | { type: "QUEUE_IN_SETUP" }
  | { type: "SELECT_LOAD"; index: number }
  | { type: "REMOVE_LOAD"; index: number }
  | { type: "OPEN"; screen: "advanced" | "done-by" }
  | { type: "OPEN_DETAIL"; place: "washer" | "dryer" }
  | { type: "BACK" }
  | { type: "TIMING_TOGGLE"; which: "eco" | "done-by" }
  | { type: "TIMING_TIME"; time: number }
  | { type: "SET_DONE_BY" }
  | { type: "INFO"; topic: AppState["info"] }
  | { type: "START" };

/** Done By picker step, minutes. */
export const TIME_STEP = 15;

/**
 * The prototype has no sleep mode (idleSleepSec: Infinity) so a demo never
 * goes dark; pass a number to try it.
 */
export function createApp(bits: NotebookBits = "011", now?: number, opts: { idleSleepSec?: number } = {}): AppState {
  const machine = reduce(createMachine({ now, config: { idleSleepSec: opts.idleSleepSec ?? Infinity } }), {
    type: "SET_START_MODE",
    bits,
  });
  return { machine, nav: [], draft: null, info: null, welcomed: false };
}

/**
 * The simulator's top speed during a move between places, so it can be
 * watched: the 2-minute transfer takes 5 real seconds, a 1-minute drop 2.5.
 */
export const MOVE_SPEED = 24;

/** The hang-dry window runs at up to 10× in the simulator: its 30 seconds take 3. */
export const HANG_DRY_SPEED = 10;

/** The finish screen's minute runs at up to 20× in the simulator, so it takes 3 seconds. */
export const FINISH_SPEED = 20;

/** The simulator slows while the hang-dry window is up (HANG_DRY_SPEED) and during a move (MOVE_SPEED). */
export function effectiveSpeed(s: AppState, requested: number): number {
  const speed = Math.min(60, Math.max(1, requested));
  if (holdRealTime(s.machine)) return Math.min(speed, HANG_DRY_SPEED);
  return s.machine.transfer ? Math.min(speed, MOVE_SPEED) : speed;
}

export const pickerOptions = (s: AppState, kind: "wash" | "dry"): ProgramId[] => {
  const order: ProgramId[] = kind === "dry" ? DRY_PICKER_ORDER : WASH_PICKER_ORDER;
  // Auto can't be used with video off.
  return s.machine.sim.videoEnabled ? order : order.filter((p) => p !== "auto");
};

const planFor = (intent: SetupIntent): LoadPlan =>
  intent === "dry-only" ? "dry-only" : intent === "wash-only" ? "wash-only" : "wash-dry";

/** Done By and Eco apply to wash runs only. */
export const timingAvailable = (d: Draft) => d.intent !== "dry-only";

export const activeLoad = (d: Draft): DraftLoad => d.loads[d.active];

function newDraftLoad(s: AppState, target: DraftLoad["target"]): DraftLoad {
  const program: ProgramId = pickerOptions(s, target.kind).includes("auto") ? "auto" : "normal";
  return { target, program, settings: presetOf(program, target.kind) };
}

/**
 * Queue Another inside setup: the washer load is set, the queue drawer is
 * free, so a second load can be set up and both start with one tap.
 */
export function canQueueInSetup(s: AppState): boolean {
  const d = s.draft;
  if (!d || d.intent === "dry-only" || d.loads.length !== 1) return false;
  // Only once there are clothes in the queue drawer.
  const q = s.machine.queue;
  return d.loads[0].target.place === "washer" && !!q && !q.plan;
}

/** The machine input the current draft would start. */
export function draftInput(s: AppState): StartRunInput | null {
  const d = s.draft;
  if (!d) return null;
  const timed = timingAvailable(d);
  return {
    loads: d.loads.map((l) => ({ place: l.target.place, settings: l.settings, plan: planFor(d.intent) })),
    doneBy: timed && d.timing.doneBy ? nextOccurrence(s.machine.now, d.timing.time) : null,
    eco: timed && d.timing.eco,
  };
}

/** Start time, finish and warnings for the draft, for Setup and Done By. */
export function draftPreview(s: AppState): RunPreview | null {
  const input = draftInput(s);
  return input ? previewRun(s.machine, input) : null;
}

const PLACE_NAME = { dryer: "dryer", drawer: "done drawer" } as const;

/** "dryer", "done drawer", or "dryer and done drawer". */
export const placesText = (places: ("dryer" | "drawer")[]) => places.map((p) => PLACE_NAME[p]).join(" and ");

/**
 * The earliest finish as the picker would offer it: rounded up to its
 * 15-minute step. Machine time keeps moving while you look (a minute a
 * second at 60×), and this keeps the number from ticking with it.
 */
export const earliestOffer = (p: RunPreview) => Math.ceil(p.earliestFinish / TIME_STEP - 1e-9) * TIME_STEP;

/** "As off-peak as possible before 6:30 PM" for Eco with Done By. */
const ecoBefore = (s: AppState) => `As off-peak as possible before ${clockLabel(draftInput(s)?.doneBy ?? 0)}`;

/** The one line under the Setup header: what's in the way, or when it'll be done. */
export function setupNote(s: AppState, preview: RunPreview | null): string {
  const d = s.draft;
  if (!d || !preview) return "";
  const loads = d.loads.length > 1 ? "these loads" : "this load";
  if (preview.clearance.places.length) return `Empty the ${placesText(preview.clearance.places)} before ${loads} can start`;
  if (timingAvailable(d) && (d.timing.doneBy || d.timing.eco)) {
    if (!preview.feasible) return `Done at ${clockLabel(earliestOffer(preview))} at the earliest`;
    if (d.timing.eco) return d.timing.doneBy ? ecoBefore(s) : "Off-peak";
    return `Done by ${clockLabel(preview.finishAt)}`;
  }
  if (preview.clearance.residual > 0) return "The last load waits until the done drawer is emptied";
  return "";
}

/** The status line above Set on the Done By screen. */
export function timingStatus(s: AppState, preview: RunPreview | null): string {
  const d = s.draft;
  const input = draftInput(s);
  if (!d || !preview || !input || (!d.timing.doneBy && !d.timing.eco)) return "";
  if (d.timing.doneBy && preview.warnings.some((w) => w.kind === "drawer-blocks-done-by")) {
    return "Empty the drawer first, or this can't finish on time";
  }
  if (!preview.feasible) return `Can't finish by then. Earliest is ${clockLabel(earliestOffer(preview))}`;
  if (d.timing.eco) return d.timing.doneBy ? ecoBefore(s) : "Off-peak";
  return preview.startAt > s.machine.now + 0.5 ? `Starts at ${clockLabel(preview.startAt)}` : "Starts now";
}

export const userBrowsing = (s: AppState) => s.nav.length > 0;

function configure(s: AppState, machine: MachineState, d: Draft): MachineState {
  const t = activeLoad(d).target;
  return reduce(machine, { type: "CONFIGURE", place: t.place, kind: t.kind });
}

function closeAll(s: AppState): AppState {
  const machine = s.draft ? reduce(s.machine, { type: "CONFIGURE_END" }) : s.machine;
  return { ...s, machine, nav: [], draft: null, info: null };
}

const touch = (m: MachineState) => reduce(m, { type: "TOUCH" });

function withActive(s: AppState, patch: (l: DraftLoad) => DraftLoad): AppState {
  if (!s.draft) return s;
  const loads = s.draft.loads.map((l, i) => (i === s.draft!.active ? patch(l) : l));
  return { ...s, draft: { ...s.draft, loads }, machine: touch(s.machine) };
}

/** Default Done By time: the next quarter hour about three hours out. */
const defaultDoneByTime = (now: number) => (Math.ceil((timeOfDay(now) + 180) / TIME_STEP) * TIME_STEP) % 1440;

export function appReduce(s: AppState, a: AppAction): AppState {
  switch (a.type) {
    case "MACHINE":
      return { ...s, machine: reduce(s.machine, a.event) };

    case "TICK": {
      const speed = effectiveSpeed(s, a.speed);
      // The hang-dry countdown runs at the simulator's speed; finish screens stay in real time.
      return {
        ...s,
        machine: tick(s.machine, {
          realSec: a.realSec,
          simMin: (a.realSec * speed) / 60,
          windowSec: a.realSec * speed,
          finishSec: a.realSec * Math.min(a.speed, FINISH_SPEED),
        }),
      };
    }

    case "WELCOME":
      return { ...s, welcomed: true, machine: touch(s.machine) };

    case "OPEN_SETUP": {
      const target = pickerTarget(s.machine, a.intent);
      const draft: Draft = {
        intent: a.intent,
        loads: [newDraftLoad(s, target)],
        active: 0,
        timing: { doneBy: false, eco: false, time: defaultDoneByTime(s.machine.now) },
      };
      return { ...s, machine: configure(s, s.machine, draft), draft, nav: ["setup"], info: null, welcomed: true };
    }

    case "PICK":
      return withActive(s, (l) => {
        const settings = presetOf(a.program, l.target.kind);
        settings.wash.hangDryNet = l.settings.wash.hangDryNet;
        return { ...l, program: a.program, settings };
      });

    case "EDIT":
      return withActive(s, (l) => ({ ...l, settings: a.settings }));

    case "QUEUE_IN_SETUP": {
      if (!canQueueInSetup(s) || !s.draft) return s;
      const draft = { ...s.draft, loads: [...s.draft.loads, newDraftLoad(s, { place: "queue", kind: "wash" })], active: 1 };
      return { ...s, draft, machine: configure(s, s.machine, draft) };
    }

    case "SELECT_LOAD": {
      if (!s.draft || !s.draft.loads[a.index]) return s;
      const draft = { ...s.draft, active: a.index };
      return { ...s, draft, machine: configure(s, s.machine, draft) };
    }

    case "REMOVE_LOAD": {
      if (!s.draft || a.index === 0 || !s.draft.loads[a.index]) return s;
      const loads = s.draft.loads.filter((_, i) => i !== a.index);
      const draft = { ...s.draft, loads, active: Math.min(s.draft.active, loads.length - 1) };
      return { ...s, draft, machine: configure(s, s.machine, draft) };
    }

    case "OPEN":
      return s.draft ? { ...s, nav: [...s.nav, a.screen], machine: touch(s.machine) } : s;

    case "OPEN_DETAIL":
      return { ...s, nav: [a.place === "washer" ? "wash-detail" : "dry-detail"], machine: touch(s.machine) };

    case "BACK": {
      if (s.info) return { ...s, info: null };
      const nav = s.nav.slice(0, -1);
      if (nav.length === 0) return closeAll(s);
      return { ...s, nav, machine: touch(s.machine) };
    }

    case "TIMING_TOGGLE": {
      if (!s.draft) return s;
      const t = s.draft.timing;
      const timing = a.which === "eco" ? { ...t, eco: !t.eco } : { ...t, doneBy: !t.doneBy };
      return { ...s, draft: { ...s.draft, timing }, machine: touch(s.machine) };
    }

    case "TIMING_TIME":
      return s.draft
        ? { ...s, draft: { ...s.draft, timing: { ...s.draft.timing, time: ((a.time % 1440) + 1440) % 1440 } }, machine: touch(s.machine) }
        : s;

    case "SET_DONE_BY": {
      if (!s.draft) return s;
      const preview = draftPreview(s);
      let timing = s.draft.timing;
      // Rule 7: a deadline that can't be met becomes the earliest possible finish.
      if (timing.doneBy && preview && !preview.feasible) {
        timing = { ...timing, time: timeOfDay(earliestOffer(preview)) };
      }
      return appReduce({ ...s, draft: { ...s.draft, timing } }, { type: "BACK" });
    }

    case "INFO":
      return { ...s, info: a.topic };

    case "START": {
      const input = draftInput(s);
      if (!input) return s;
      const preview = previewRun(s.machine, input);
      // Rule 7: a deadline that can't be met runs to the earliest finish.
      const fixed = input.doneBy != null && !preview.feasible ? { ...input, doneBy: preview.earliestFinish, eco: false } : input;
      const machine = reduce(s.machine, { type: "START_RUN", input: fixed });
      return { ...s, machine, nav: [], draft: null, info: null };
    }
  }
}

/** Show the welcome screen instead of the resting screen. */
export function showWelcome(s: AppState): boolean {
  if (s.welcomed || s.nav.length || overlayScreen(s.machine, false)) return false;
  const base = baseScreen(s.machine);
  return base === "home" || base === "ready" || base === "dry-only";
}

/**
 * The reducer the UI uses: an action, then the automatic navigation rules.
 * - The screen went to sleep: drop any half-finished setup, and greet again on wake.
 * - A raw load sits in the dryer: once past the welcome, go straight to its dry settings.
 */
/** The place still holds clothes this setup can be for: there, and not already part of a run. */
function targetStillRaw(m: MachineState, place: DraftLoad["target"]["place"]): boolean {
  if (place === "washer") return m.washer?.status === "raw" && !m.washer.load.plan;
  if (place === "dryer") return m.dryer?.status === "raw" && !m.dryer.load.plan;
  return !!m.queue && !m.queue.plan;
}

/**
 * Clothes taken out mid-setup: drop that load from the draft. If it was the
 * main load, close setup and go back to the resting screen.
 */
function pruneDraft(s: AppState): AppState {
  const d = s.draft;
  if (!d) return s;
  if (!targetStillRaw(s.machine, d.loads[0].target.place)) return closeAll(s);
  const loads = d.loads.filter((l, i) => i === 0 || targetStillRaw(s.machine, l.target.place));
  if (loads.length === d.loads.length) return s;
  const draft = { ...d, loads, active: Math.min(d.active, loads.length - 1) };
  return { ...s, draft, machine: configure(s, s.machine, draft) };
}

export function step(s: AppState, a: AppAction): AppState {
  let next = appReduce(s, a);
  next = pruneDraft(next);
  // Asleep with nothing in progress: greet again on wake. A setup in progress is kept as it was.
  if (!next.machine.ui.awake && next.welcomed && next.nav.length === 0) next = { ...next, welcomed: false };
  if (
    next.welcomed &&
    next.nav.length === 0 &&
    next.machine.ui.awake &&
    overlayScreen(next.machine) == null &&
    baseScreen(next.machine) === "dry-only"
  ) {
    next = appReduce(next, { type: "OPEN_SETUP", intent: "dry-only" });
  }
  return next;
}

/** Machine time display for the simulator. */
export { clockLabel, durationLabel } from "./scheduler";
