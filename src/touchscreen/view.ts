/**
 * View models: what each screen says, derived from machine state. Pure, no
 * React, so the production screen can reuse the copy rules.
 */
import { clearance, queueHeldByNet, runRemaining, washerGate, washerStartsAt } from "./machine";
import { clockLabel, durationLabel } from "./scheduler";
import type { FinishedLoad, LoadSettings, MachineState, Transfer } from "./types";

export interface Tile {
  place: "washer" | "dryer";
  /** Small line above the number. */
  status: string;
  /** The big line: a countdown, or a word when there's nothing to count. */
  big: string;
  /** Load type below. */
  type: string;
  /** Running right now: purple means alive. */
  active: boolean;
  /** The big line is a countdown (tabular, light weight). */
  numeric: boolean;
  /** Tapping the tile does this instead of opening the detail screen. */
  action?: "clear-net";
}

const label = (s: LoadSettings | null | undefined) => s?.label ?? "Load";

export function washerTile(m: MachineState): Tile | null {
  const w = m.washer;
  if (!w) {
    // Held in the queue drawer until the net is cleared.
    if (queueHeldByNet(m)) {
      return { place: "washer", status: "Waiting", type: label(m.queue!.settings), active: false, big: "Clear the net", numeric: false, action: "clear-net" };
    }
    // Queued: the queued load's type, no timer.
    if (m.queue?.plan) return { place: "washer", status: "Queued", big: label(m.queue.settings), type: "In the drawer", active: false, numeric: false };
    return null;
  }
  const type = label(w.load.settings);
  const t = (min: number) => ({ big: durationLabel(min), numeric: true });
  switch (w.status) {
    case "washing":
      return { place: "washer", status: "Washing", type, active: true, ...t(w.remaining) };
    case "paused":
      return { place: "washer", status: "Paused", type, active: false, ...t(w.remaining) };
    case "wet":
      return { place: "washer", status: "Waiting for the dryer", type, active: false, ...t(m.dryer?.remaining ?? 0) };
    case "finished":
      return { place: "washer", status: "Washed", type, active: false, big: "Done", numeric: false };
    case "waiting": {
      const gate = washerGate(m);
      if (gate.kind === "blocked" && gate.reason === "net") {
        return { place: "washer", status: "Waiting", type, active: false, big: "Clear the net", numeric: false, action: "clear-net" };
      }
      // Held until something is emptied: there's no countdown to show.
      if (gate.kind === "blocked" && (gate.reason === "drawer" || gate.reason === "dryer")) {
        return { place: "washer", status: "Waiting", type, active: false, big: "On hold", numeric: false };
      }
      const at = washerStartsAt(m);
      return { place: "washer", status: "Waiting", type, active: false, ...t(at != null ? at - m.now : 0) };
    }
    case "raw":
      return { place: "washer", status: "Not set up", type: "", active: false, big: "Washer", numeric: false };
  }
}

export function dryerTile(m: MachineState): Tile | null {
  const d = m.dryer;
  if (!d) return null;
  const type = label(d.load.settings);
  switch (d.status) {
    case "drying":
      return { place: "dryer", status: "Drying", type, active: true, big: durationLabel(d.remaining), numeric: true };
    case "paused":
      return { place: "dryer", status: "Paused", type, active: false, big: durationLabel(d.remaining), numeric: true };
    case "tumbling": {
      const until = m.run?.doneBy;
      const toDeadline = until != null && !(m.washer?.status === "washing" || m.washer?.status === "wet");
      return toDeadline
        ? { place: "dryer", status: "Dry, tumbling gently", type, active: true, big: durationLabel(until - m.now), numeric: true }
        : { place: "dryer", status: "Dry, tumbling gently", type, active: true, big: "Done", numeric: false };
    }
    case "finished":
      return { place: "dryer", status: "Dry", type, active: false, big: "Done", numeric: false };
    case "raw":
      return m.run && !m.run.started
        ? { place: "dryer", status: "Waiting", type, active: false, big: durationLabel(m.run.startAt - m.now), numeric: true }
        : { place: "dryer", status: "Not set up", type: "", active: false, big: "Dryer", numeric: false };
  }
}

/** One line per place for the machine view, e.g. "Normal · washing 0:35". */
export function placeCaption(m: MachineState, place: "queue" | "washer" | "dryer" | "drawer"): string {
  const dur = (min: number) => durationLabel(min);
  switch (place) {
    case "queue":
      return !m.queue ? "Empty" : !m.queue.plan ? "Loaded" : `${label(m.queue.settings)} · queued`;
    case "washer": {
      if (m.transfer) {
        const t = m.transfer;
        if (t.kind === "to-dryer") return `${label(t.load.settings)} · moving to the dryer`;
        if (t.kind === "to-washer") return `${label(t.load.settings)} · dropping in`;
      }
      const w = m.washer;
      if (!w) return m.netHasClothes ? "Hang-dry clothes in the net" : "Empty";
      const l = label(w.load.settings);
      switch (w.status) {
        case "raw": return w.load.plan ? `${l} · set up` : "Loaded";
        case "waiting": return `${l} · waiting`;
        case "washing": return `${l} · washing ${dur(w.remaining)}`;
        case "paused": return `${l} · paused`;
        case "wet": return `${l} · washed, waiting for the dryer`;
        case "finished": return `${l} · washed`;
      }
    }
    case "dryer": {
      const d = m.dryer;
      if (m.transfer?.kind === "to-drawer") return `${label(m.transfer.load.settings)} · dropping to the done drawer`;
      if (!d) return "Empty";
      const l = label(d.load.settings);
      switch (d.status) {
        case "raw": return d.load.plan ? `${l} · set up` : "Loaded";
        case "drying": return `${l} · drying ${dur(d.remaining)}`;
        case "paused": return `${l} · paused`;
        case "tumbling": return `${l} · dry, tumbling`;
        case "finished": return `${l} · dry`;
      }
    }
    case "drawer":
      return m.drawer ? `${label(m.drawer.settings)} · done` : "Empty";
  }
}

/** Queued: the running load is on the tiles; this names the load waiting in the drawer. */
export const queuedText = (m: MachineState): string | null =>
  m.washer && m.queue?.plan ? `Queued · ${label(m.queue.settings)}` : null;

/** Queue Another shows once there are clothes in the queue drawer that aren't part of the run yet. */
export const canQueueAnother = (m: MachineState) => !!m.run && !!m.queue && !m.queue.plan;

/**
 * Sleep: the countdown you were watching, readable across the room. It
 * carries on from the awake screen, runs to 0:00, then the next phase takes
 * over (the transfer wakes the screen in between). When two phases are
 * counting, the one that ends first is shown.
 */
export function sleepView(m: MachineState): { label: string; big: string } | null {
  if (!m.run) return null;
  const candidates = [washerTile(m), dryerTile(m)].filter((t): t is Tile => !!t && t.numeric);
  if (!candidates.length) {
    const r = runRemaining(m);
    return r == null ? null : { label: "", big: durationLabel(r) };
  }
  const minutes = (t: Tile) => {
    const [h, mm] = t.big.split(":").map(Number);
    return h * 60 + mm;
  };
  const next = candidates.reduce((a, b) => (minutes(b) < minutes(a) ? b : a));
  return { label: next.status, big: next.big };
}

export function drawerText(m: MachineState): string {
  return `${label(m.washer?.load.settings)} will start on its own once the drawer is clear.`;
}

/** Pro tip body: names what makes the next load harsh. */
export function proTipText(m: MachineState): string {
  const p = m.pendingStart;
  const load = p?.input.loads.find((l) => l.place === p.harshPlace);
  const hot = load?.settings.wash.waterTemp === "hot";
  const bleach = (load?.settings.wash.bleachCups ?? 0) > 0;
  const what = hot && bleach ? "hot water and bleach" : hot ? "hot water" : "bleach";
  return `It uses ${what}, which can be rough on what's in the net.`;
}

/** Programs whose names are already plural or mass nouns: "Your Delicates are done", not "Your Delicates load". */
const NAMED_LOADS: Partial<Record<FinishedLoad["program"], "is" | "are">> = {
  delicates: "are",
  bedding: "is",
  "warm-towels": "are",
};
const WHERE = { washer: "the washer", dryer: "the dryer", drawer: "the done drawer" } as const;

/** The finish screen for the oldest load that just completed. */
export function finishView(m: MachineState): { title: string; sub: string } | null {
  const f = m.finished[0];
  if (!f) return null;
  const verb = NAMED_LOADS[f.program];
  const title = verb ? `Your ${f.label} ${verb} done` : `Your ${f.label} load is done`;
  const pronoun = verb === "are" ? "them" : "it";
  const tumble = f.tumbleUntil != null ? ` ${verb === "are" ? "They tumble" : "It tumbles"} gently until ${clockLabel(f.tumbleUntil)}.` : "";
  return { title, sub: `You can find ${pronoun} in ${WHERE[f.place]}.${tumble}` };
}

export interface StatusLine {
  text: string;
  /** Running right now, or done and waiting to be taken out: a purple dot. */
  active: boolean;
}

/** Everything in the machine, for the main page: "Drying · Auto · 0:32", "Done drawer · Auto". */
export function activeStatuses(m: MachineState): StatusLine[] {
  const lines: StatusLine[] = [washerTile(m), dryerTile(m)]
    .filter((t): t is Tile => !!t && t.status !== "Not set up" && t.status !== "Queued")
    .map((t) => ({ text: [t.status, t.type, t.numeric ? t.big : ""].filter(Boolean).join(" · "), active: t.active || t.big === "Done" }));
  if (m.transfer) lines.unshift({ text: movingText(m.transfer), active: true });
  if (m.drawer) lines.push({ text: `Done drawer · ${label(m.drawer.settings)}`, active: true });
  return lines;
}

const INTO = { "to-drawer": "the done drawer", "to-dryer": "the dryer", "to-washer": "the washer" } as const;

/** What the transfer screen says, naming the load: "Moving your Normal load into the dryer", "Moving your Delicates into the washer". */
export function movingText(t: Transfer): string {
  const program = t.load.settings?.program;
  const name = program && NAMED_LOADS[program] ? t.load.settings!.label : `${label(t.load.settings)} load`;
  return `Moving your ${name} into ${INTO[t.kind]}`;
}

/**
 * The modal after Start when something has to be emptied first. It can't be
 * dismissed; it goes away once the places are empty.
 */
export function clearanceView(m: MachineState): { title: string; sub: string } | null {
  if (!m.run) return null;
  const { places } = clearance(m);
  if (!places.length) return null;
  const what = places.map((p) => (p === "dryer" ? "dryer" : "done drawer")).join(" and ");
  const pending = (m.washer?.load.plan === "wash-dry" ? 1 : 0) + (m.queue?.plan === "wash-dry" ? 1 : 0);
  const name = label(m.washer?.load.settings ?? m.queue?.settings);
  return {
    title: `Empty the ${what} to start`,
    sub: pending > 1 ? "Your loads start on their own once it's clear." : `${name} starts on its own once it's clear.`,
  };
}
