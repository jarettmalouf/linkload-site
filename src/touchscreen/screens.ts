/**
 * Which screen the machine shows. Pure, no React.
 *
 * Machine-driven overlays (prompts, transfer, sleep) take priority over
 * whatever the user was browsing. Screen components only render the result.
 */
import { needsAttention, notebookBits } from "./machine";
import type { MachineState, NotebookBits } from "./types";

/** Home-screen buttons, by notebook mode. */
export interface HomeOptions {
  /** Logo opens the full run. */
  fullRun: boolean;
  washOnly: boolean;
  /**
   * A raw load in the dryer goes first: the machine doesn't know how to dry
   * it, so it skips home, lights the dryer and shows the dry settings.
   * (Overrides the spec's 101/110/111 rows; decided Nov 3.)
   */
  straightToDryOnly: boolean;
  /** 000: nothing loaded. */
  empty: boolean;
}

export function homeOptions(bits: NotebookBits): HomeOptions {
  const [d, w, q] = bits.split("").map((b) => b === "1");
  const anyWash = w || q;
  return {
    fullRun: !d && anyWash,
    washOnly: !d && anyWash,
    straightToDryOnly: d,
    empty: !d && !anyWash,
  };
}

export type SetupIntent = "full-run" | "wash-only" | "dry-only" | "queue-another";

/**
 * One picker per setup. It refers to the washer's load, unless the washer is
 * empty and the queue holds the load (the click-in drawer case), or the user
 * chose Queue Another or Dry Only.
 */
export function pickerTarget(
  s: MachineState,
  intent: SetupIntent,
): { place: "washer" | "queue" | "dryer"; kind: "wash" | "dry" } {
  if (intent === "dry-only") return { place: "dryer", kind: "dry" };
  if (intent === "queue-another") return { place: "queue", kind: "wash" };
  if (!s.washer && s.queue && !s.queue.plan) return { place: "queue", kind: "wash" };
  return { place: "washer", kind: "wash" };
}

/** Screens the machine forces, above anything the user is doing. */
export type OverlayScreen = "failed" | "pro-tip" | "hang-dry" | "transfer" | "finish" | "sleep";

/** What the screen rests on when nobody is navigating. */
export type BaseScreen = "dry-only" | "home" | "progress" | "ready";

export type SystemScreen = OverlayScreen | BaseScreen | "browsing";

/**
 * `userBrowsing` is true while the user is in a flow (Setup, Advanced, Done
 * By, detail screens). The transfer animation then waits instead of
 * interrupting, unless the screen was asleep.
 */
export function overlayScreen(s: MachineState, userBrowsing = false): OverlayScreen | null {
  if (s.failure) return "failed";
  if (s.pendingStart) return "pro-tip";
  if (s.hangDry) return "hang-dry";
  // The screen wakes for the transfer animation, then goes back to sleep.
  if (s.transfer && (!s.ui.awake || !userBrowsing)) return "transfer";
  // Every completed load gets a finish screen, then the main page returns.
  if (s.finished.length) return "finish";
  if (!s.ui.awake && !needsAttention(s)) return "sleep";
  return null;
}

export function baseScreen(s: MachineState): BaseScreen {
  const home = homeOptions(notebookBits(s));
  if (home.straightToDryOnly) return "dry-only";
  if (s.run) {
    // A raw load in the washer still needs setting up, even mid-run.
    if (s.washer?.status === "raw" && !s.washer.load.plan) return "home";
    if (!s.washer && s.queue && !s.queue.plan) return "home";
    // Anything that must be emptied shows as a modal over Progress (view.clearanceView).
    return "progress";
  }
  return home.empty ? "ready" : "home";
}

export function systemScreen(s: MachineState, userBrowsing = false): SystemScreen {
  return overlayScreen(s, userBrowsing) ?? (userBrowsing ? "browsing" : baseScreen(s));
}
