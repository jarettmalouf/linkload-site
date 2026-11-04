/**
 * LinkLoad touchscreen — core types.
 *
 * Plain TypeScript, no React. All times are in minutes. Absolute times are
 * minutes since the simulation epoch (day 0, 00:00); `clock` helpers turn
 * them into wall-clock strings.
 */

export type WaterTemp = "cold" | "warm" | "hot";

export type WashProgramId = "delicates" | "bedding" | "auto" | "normal" | "heavy-duty";
export type DryProgramId = "auto" | "warm-towels" | "normal" | "delicates";
export type ProgramId = WashProgramId | DryProgramId;

export interface WashSettings {
  minutes: number;
  waterTemp: WaterTemp;
  detergentCups: number;
  softenerCups: number;
  bleachCups: number;
  hangDryNet: boolean;
}

export interface DrySettings {
  minutes: number;
  dryerSheets: number;
}

export interface LoadSettings {
  program: ProgramId;
  /** Display name, e.g. "Heavy Duty". */
  label: string;
  wash: WashSettings;
  dry: DrySettings;
  /** Extra minutes beyond nominal dry for the "longest likely" finish. */
  dryMarginMin: number;
  /** True when the user picked Auto; the scan runs at start. */
  auto: boolean;
}

/** What the run does with a load. `null` on a Load means raw and not in a run. */
export type LoadPlan = "wash-dry" | "wash-only" | "dry-only";

export interface Load {
  id: string;
  settings: LoadSettings | null;
  plan: LoadPlan | null;
  /** Its finish screen has been shown (or queued). */
  announced?: boolean;
  /**
   * Don't start washing before this absolute minute. Set when a load joins a
   * run that is already going (e.g. a dry is running) with Done By or Eco.
   */
  holdUntil?: number;
}

// ── Places ──────────────────────────────────────────────────────────────────

export type PlaceId = "queue" | "washer" | "dryer" | "drawer";

/**
 * Washer states from the spec: empty, raw, waiting, washing, paused, wet and finished.
 * `wet` = washed, waiting for transfer. `finished` = wash-only load, done.
 */
export type WasherStatus = "raw" | "waiting" | "washing" | "paused" | "wet" | "finished";

/** Dryer states from the spec: empty, raw, drying, paused, finished and tumbling. */
export type DryerStatus = "raw" | "drying" | "paused" | "finished" | "tumbling";

export interface WasherSlot {
  load: Load;
  status: WasherStatus;
  /** Minutes of washing left (meaningful while washing or paused). */
  remaining: number;
  /** Status to return to on resume. */
  pausedFrom?: WasherStatus;
}

export interface DryerSlot {
  load: Load;
  status: DryerStatus;
  /** Minutes of nominal drying left. */
  remaining: number;
  /** Longest-likely margin for this dry; likely end = now + remaining + margin. */
  margin: number;
  pausedFrom?: DryerStatus;
}

/**
 * A load moving between places. One at a time, in this order when several
 * are due: the dry load drops into the done drawer, then the wet load moves
 * into the dryer, then the queued load drops into the washer.
 */
export type TransferKind = "to-drawer" | "to-dryer" | "to-washer";

export interface Transfer {
  kind: TransferKind;
  load: Load;
  remaining: number;
  /** Machine minutes the whole move takes. */
  total: number;
  /** 1-based attempt number (only the washer-to-dryer move retries). */
  attempt: number;
}

// ── Run ─────────────────────────────────────────────────────────────────────

export interface Run {
  /** Absolute minute the run begins (later than creation for Done By / Eco). */
  startAt: number;
  started: boolean;
  /** Absolute Done By deadline, if any. The last load tumbles until it. */
  doneBy: number | null;
  eco: boolean;
  /** Notify Me chosen on the pro tip: harsh loads wait for the net to clear. */
  netBlock: boolean;
  warnings: RunWarning[];
  /** Load ids already notified for a block, so each block notifies once. */
  notified: string[];
}

export type RunWarning =
  /** Rule 8: a load beyond the unattended limit needs the drawer emptied. */
  | { kind: "needs-drawer"; loadId: string }
  /** Rule 6: the drawer blocks this Done By run. */
  | { kind: "drawer-blocks-done-by" };

// ── Prompts and human-facing windows ───────────────────────────────────────

export interface HangDryWindow {
  /** Real seconds left in the countdown. */
  secondsLeft: number;
  /** Yes pressed: drum unlocked, waiting for Resume. Countdown stops. */
  unlocked: boolean;
}

export interface PendingStart {
  /** "start" begins a run; "add" queues another load into the running one. */
  mode: "start" | "add";
  input: StartRunInput;
  /** Where the harsh load that triggered the pro tip sits. */
  harshPlace: RunLoadInput["place"];
}

export interface TransferFailure {
  load: Load;
}

/** A load just completed; the finish screen shows it. */
export interface FinishedLoad {
  loadId: string;
  program: ProgramId;
  label: string;
  /** Where to find it. */
  place: "washer" | "dryer" | "drawer";
  /** Tumbling gently until this Done By time. */
  tumbleUntil: number | null;
  /** Real seconds until the screen returns on its own. */
  secondsLeft: number;
}

export interface Notification {
  at: number;
  kind: "net-reminder" | "transfer-failed" | "drawer-full";
  text: string;
}

// ── Config and simulator knobs ─────────────────────────────────────────────

export type ScanOutcome = "confident" | "unsure" | "fail";

export interface MachineConfig {
  /** Washer to dryer. */
  transferMin: number;
  /** Dry load from the dryer into the done drawer. */
  drawerDropMin: number;
  /** Queued load from the queue drawer into the washer. */
  queueDropMin: number;
  transferAttempts: number;
  hangDryWindowSec: number;
  idleSleepSec: number;
  /** Off-peak energy window as minutes past midnight. May wrap midnight. */
  offPeak: { start: number; end: number };
  /** Wake-up time Eco aims for when Done By is off, minutes past midnight. */
  wakeup: number;
  /** Margin when Auto is unsure about the dry. */
  autoUnsureMarginMin: number;
  /** Seconds the finish screen stays up before returning to the main page (a minute; 3 s in the simulator). */
  finishScreenSec: number;
}

export interface SimKnobs {
  videoEnabled: boolean;
  scanOutcome: ScanOutcome;
  /** The next transfer exhausts every retry and fails. */
  failNextTransfer: boolean;
}

export interface UiState {
  awake: boolean;
  idleSec: number;
  /** The load being set up on screen; its place lights up. */
  configuring: { place: "queue" | "washer" | "dryer"; kind: "wash" | "dry" } | null;
}

// ── Machine ─────────────────────────────────────────────────────────────────

export interface MachineState {
  now: number;
  config: MachineConfig;
  sim: SimKnobs;

  queue: Load | null;
  washer: WasherSlot | null;
  dryer: DryerSlot | null;
  drawer: Load | null;
  transfer: Transfer | null;

  /** Hang-dry clothes are sitting in the net inside the washer. */
  netHasClothes: boolean;

  run: Run | null;
  pendingStart: PendingStart | null;
  hangDry: HangDryWindow | null;
  failure: TransferFailure | null;
  /** Finish screens waiting to be shown, oldest first. */
  finished: FinishedLoad[];
  notifications: Notification[];

  ui: UiState;
  nextId: number;
}

// ── Inputs ──────────────────────────────────────────────────────────────────

export interface RunLoadInput {
  place: "dryer" | "washer" | "queue";
  settings: LoadSettings;
  plan: LoadPlan;
}

export interface StartRunInput {
  loads: RunLoadInput[];
  /** Absolute Done By deadline, or null. */
  doneBy: number | null;
  eco: boolean;
}

export type MachineEvent =
  // User, on the screen
  | { type: "START_RUN"; input: StartRunInput }
  | { type: "PRO_TIP_FINE" }
  | { type: "PRO_TIP_NOTIFY" }
  | { type: "ADD_TO_RUN"; load: RunLoadInput }
  | { type: "HANG_DRY_YES" }
  | { type: "HANG_DRY_SKIP" }
  | { type: "HANG_DRY_RESUME" }
  | { type: "PAUSE"; place: "washer" | "dryer" }
  | { type: "RESUME"; place: "washer" | "dryer" }
  | { type: "CANCEL"; place: "washer" | "dryer" }
  | { type: "SET_DRY_MINUTES"; place: "washer" | "dryer"; minutes: number }
  | { type: "SET_DRYER_SHEETS"; place: "washer" | "dryer"; sheets: number }
  | { type: "RESUME_AFTER_FAILURE" }
  | { type: "FINISH_OK" }
  | { type: "TOUCH" }
  | { type: "CONFIGURE"; place: "queue" | "washer" | "dryer"; kind: "wash" | "dry" }
  | { type: "CONFIGURE_END" }
  // Physical world
  | { type: "APPROACH" }
  | { type: "LOAD_PLACE"; place: PlaceId }
  | { type: "EMPTY_PLACE"; place: PlaceId }
  | { type: "NET_CLEARED" }
  // Simulator only
  | { type: "SET_START_MODE"; bits: NotebookBits }
  | { type: "FORCE_TRANSFER_FAIL" }
  | { type: "DRY_OVERRUN"; minutes: number }
  | { type: "SET_SCAN_OUTCOME"; outcome: ScanOutcome }
  | { type: "SET_VIDEO"; enabled: boolean }
  | { type: "SET_TIME"; now: number };

/** Notebook three-bit mode, written dryer-washer-queue, e.g. "101". */
export type NotebookBits = "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111";
