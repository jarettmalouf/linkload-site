/**
 * Named starting points, built by sending real events to the machine so
 * every scene is a state the machine can actually reach. Used by ?scene= and
 * the simulator's jump list.
 */
import { appReduce, createApp, step, type AppAction, type AppState } from "./app";
import { tick } from "./machine";
import { dryPreset, washPreset } from "./programs";
import type { MachineEvent } from "./types";

const m = (event: MachineEvent): AppAction => ({ type: "MACHINE", event });
/** A machine someone has already greeted (past the welcome screen). */
const greeted = (...args: Parameters<typeof createApp>): AppState => ({ ...createApp(...args), welcomed: true });
const run = (s: AppState, ...actions: AppAction[]) => actions.reduce(step, s);
/** Machine time passes; nobody walks away, so the idle timer doesn't move. */
const advance = (s: AppState, simMin: number): AppState => ({ ...s, machine: tick(s.machine, { simMin }) });

const normal = washPreset("normal");
const heavy = washPreset("heavy-duty");
const delicates = washPreset("delicates");
const withNet = { ...normal, wash: { ...normal.wash, hangDryNet: true } };

const start = (s: AppState, loads: { place: "washer" | "queue" | "dryer"; settings: typeof normal; plan: "wash-dry" | "wash-only" | "dry-only" }[], doneBy: number | null = null) =>
  run(s, m({ type: "START_RUN", input: { loads, doneBy, eco: false } }));

export const SCENES = {
  welcome: () => createApp("011"),
  home: () => greeted("011"),
  ready: () => greeted("000"),
  setup: () => run(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" }),
  "dry-only": () => run(greeted("100"), m({ type: "TOUCH" })),
  advanced: () => run(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" }, { type: "PICK", program: "heavy-duty" }, { type: "OPEN", screen: "advanced" }),
  "done-by": () =>
    run(greeted("010", 12 * 60), { type: "OPEN_SETUP", intent: "full-run" }, { type: "PICK", program: "normal" }, { type: "OPEN", screen: "done-by" }, { type: "TIMING_TOGGLE", which: "done-by" }, { type: "TIMING_TIME", time: 18 * 60 + 30 }),
  progress: () => {
    // Heavy Duty drying, Delicates staggered behind it.
    let s = start(greeted("011"), [
      { place: "washer", settings: heavy, plan: "wash-dry" },
      { place: "queue", settings: delicates, plan: "wash-dry" },
    ]);
    return advance(s, 59);
  },
  queued: () => {
    let s = start(greeted("010"), [{ place: "washer", settings: normal, plan: "wash-dry" }]);
    s = run(s, m({ type: "LOAD_PLACE", place: "queue" }), m({ type: "ADD_TO_RUN", load: { place: "queue", settings: delicates, plan: "wash-dry" } }));
    return advance(s, 20);
  },
  "wash-detail": () => run(start(greeted("010"), [{ place: "washer", settings: heavy, plan: "wash-dry" }]), { type: "OPEN_DETAIL", place: "washer" }),
  "dry-detail": () => run(advance(start(greeted("010"), [{ place: "washer", settings: heavy, plan: "wash-dry" }]), 70), { type: "OPEN_DETAIL", place: "dryer" }),
  // Normal washes 45 minutes, then moves to the dryer for 2.
  transfer: () => advance(start(greeted("010"), [{ place: "washer", settings: normal, plan: "wash-dry" }]), 46),
  "hang-dry": () => advance(start(greeted("010"), [{ place: "washer", settings: withNet, plan: "wash-dry" }]), 47.1),
  // After the first load reaches the dryer, the queued load drops into the washer.
  "drop-washer": () =>
    advance(start(greeted("011"), [{ place: "washer", settings: normal, plan: "wash-dry" }, { place: "queue", settings: delicates, plan: "wash-dry" }]), 47.5),
  // Heavy Duty dries until 2:02; it drops into the done drawer just as Delicates finishes washing.
  "drop-drawer": () =>
    advance(start(greeted("011"), [{ place: "washer", settings: heavy, plan: "wash-dry" }, { place: "queue", settings: delicates, plan: "wash-dry" }]), 122.5),
  "pro-tip": () =>
    start(greeted("011"), [
      { place: "washer", settings: withNet, plan: "wash-dry" },
      { place: "queue", settings: { ...heavy, wash: { ...heavy.wash, waterTemp: "hot" } }, plan: "wash-dry" },
    ]),
  drawer: () => {
    let s = run(greeted("010"), m({ type: "LOAD_PLACE", place: "drawer" }));
    s = start(s, [{ place: "washer", settings: delicates, plan: "wash-dry" }]);
    s = run(s, m({ type: "LOAD_PLACE", place: "queue" }), m({ type: "ADD_TO_RUN", load: { place: "queue", settings: delicates, plan: "wash-dry" } }));
    return advance(s, 45);
  },
  failed: () => {
    const s = run(start(greeted("010"), [{ place: "washer", settings: normal, plan: "wash-dry" }]), m({ type: "FORCE_TRANSFER_FAIL" }));
    return advance(s, 62);
  },
  sleep: () => {
    const s = start(greeted("010"), [{ place: "washer", settings: heavy, plan: "wash-dry" }]);
    return { ...s, machine: appReduce(advance(s, 62), { type: "TICK", realSec: 31, speed: 1 }).machine };
  },
  "queue-in-setup": () =>
    run(greeted("011"), { type: "OPEN_SETUP", intent: "full-run" }, { type: "PICK", program: "normal" }, { type: "QUEUE_IN_SETUP" }, { type: "PICK", program: "delicates" }),
  "eco": () =>
    run(greeted("010", 15 * 60), { type: "OPEN_SETUP", intent: "full-run" }, { type: "PICK", program: "normal" }, { type: "OPEN", screen: "done-by" }, { type: "TIMING_TOGGLE", which: "eco" }),
  "dry-first": () => run(greeted("110"), m({ type: "TOUCH" })),
  finish: () => advance(start(greeted("100"), [{ place: "dryer", settings: dryPreset("warm-towels"), plan: "dry-only" }]), 16),
  // Queue and washer loaded, a dry load sitting in the dryer, the done drawer full: both must be emptied.
  clearance: () => {
    let s = start(greeted("111"), [{ place: "dryer", settings: dryPreset("auto"), plan: "dry-only" }]);
    s = run(advance(s, 60), m({ type: "FINISH_OK" }), m({ type: "LOAD_PLACE", place: "drawer" }));
    return start(s, [
      { place: "washer", settings: normal, plan: "wash-dry" },
      { place: "queue", settings: delicates, plan: "wash-dry" },
    ]);
  },
  // Notify Me chosen, hang-dry clothes left in the net: the harsh queued load waits in its drawer.
  "net-hold": () => {
    const tip = start(greeted("011"), [
      { place: "washer", settings: withNet, plan: "wash-dry" },
      { place: "queue", settings: { ...heavy, wash: { ...heavy.wash, waterTemp: "hot" } }, plan: "wash-dry" },
    ]);
    const s = advance(run(tip, m({ type: "PRO_TIP_NOTIFY" })), 47.01);
    return advance(run(s, m({ type: "HANG_DRY_SKIP" })), 1);
  },
  "name-preset": () =>
    run(
      greeted("010"),
      { type: "OPEN_SETUP", intent: "full-run" },
      { type: "PICK", program: "normal" },
      { type: "OPEN", screen: "advanced" },
      { type: "OPEN_NAME_PRESET" },
      ..."baby clothes".split("").map((key): AppAction => ({ type: "PRESET_KEY", key })),
    ),
  "dry-only-start": () => start(greeted("100"), [{ place: "dryer", settings: dryPreset("warm-towels"), plan: "dry-only" }]),
} satisfies Record<string, () => AppState>;

export type SceneName = keyof typeof SCENES;
export const isScene = (x: string | undefined): x is SceneName => !!x && x in SCENES;
