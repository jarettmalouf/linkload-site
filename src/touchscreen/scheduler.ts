/**
 * LinkLoad scheduler — pure functions, no state.
 *
 * Mirrors docs/touchscreen/reference/scheduler_check.py. The machine
 * (machine.ts) uses these rules tick by tick; the closed-form `planTwoLoads`
 * exists so the notebook numbers can be checked directly.
 */

// ── Clock helpers ───────────────────────────────────────────────────────────

export const DAY = 24 * 60;

/** Minutes past midnight for an absolute minute. */
export const timeOfDay = (abs: number): number => ((abs % DAY) + DAY) % DAY;

/** "3:31" — 12-hour clock without a suffix, matching the notebook. */
export function clock12(abs: number): string {
  const m = Math.round(timeOfDay(abs));
  const h = Math.floor(m / 60) % 12 || 12;
  return `${h}:${String(m % 60).padStart(2, "0")}`;
}

/** "3:31 PM" */
export function clockLabel(abs: number): string {
  const m = Math.round(timeOfDay(abs));
  return `${clock12(abs)} ${m >= 720 ? "PM" : "AM"}`;
}

/** "0:58" — hours:minutes for a duration, as on Progress and Sleep. */
export function durationLabel(minutes: number): string {
  // Rounded, so a countdown visibly reaches 0:00 before the next phase.
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** Next absolute minute at or after `now` whose time of day is `minutesPastMidnight`. */
export function nextOccurrence(now: number, minutesPastMidnight: number): number {
  // Whole-day arithmetic, so 6:00 never comes out as 5:59.999 (which read as 5:59).
  const today = Math.floor(now / DAY) * DAY + minutesPastMidnight;
  return today >= now ? today : today + DAY;
}

// ── Start rule ──────────────────────────────────────────────────────────────

export type DryerOccupancy = "empty" | "occupied";
export type DrawerOccupancy = "empty" | "full";

/**
 * Rules 1 and 2. A wash may start if the dryer is empty or the drawer is
 * empty. It may not start if the dryer holds a load and the drawer is full.
 */
export function canStartWash(dryer: DryerOccupancy, drawer: DrawerOccupancy): boolean {
  return dryer === "empty" || drawer === "empty";
}

/**
 * How many loads the drawer would need to take before the last wash load can
 * reach the dryer. The last load stays in the dryer, so it never needs the
 * drawer.
 */
export function drawerExitsNeeded(dryerOccupied: boolean, washLoads: number): number {
  return Math.max(0, (dryerOccupied ? 1 : 0) + washLoads - 1);
}

/**
 * Unattended limit: how many wash loads can run with nobody emptying the
 * drawer. Two at most from an empty drawer, one from a full drawer.
 */
export function maxUnattendedWashLoads(dryerOccupied: boolean, drawerFull: boolean): number {
  const drawerSlots = drawerFull ? 0 : 1;
  // exits(n) = (dryerOccupied ? 1 : 0) + n - 1 <= drawerSlots
  return Math.max(0, drawerSlots + 1 - (dryerOccupied ? 1 : 0));
}

// ── Notebook closed form ───────────────────────────────────────────────────

export interface LoadTimes {
  wash: number;
  dry: number;
  /** Extra minutes beyond nominal for the longest likely finish. */
  dryMargin?: number;
}

/** Notebook: T_FC = 2T + W1 + max(D1, W2) + D2, with D1 the longest likely dry. */
export function fullCycle(l1: LoadTimes, l2: LoadTimes, transfer: number): number {
  const d1 = l1.dry + (l1.dryMargin ?? 0);
  return 2 * transfer + l1.wash + Math.max(d1, l2.wash) + l2.dry + (l2.dryMargin ?? 0);
}

export interface TwoLoadPlan {
  total: number;
  start: number;
  w1End: number;
  t1End: number;
  d1End: number;
  w2Start: number;
  w2End: number;
  t2Start: number;
  t2End: number;
  d2End: number;
  /** Minutes load 1 sits in the drawer before the run ends. */
  l1DrawerWait: number;
  /** Minutes load 2 sits wet in the washer. Always 0 by design. */
  wetWait: number;
}

/** Two-load schedule against a Done By deadline (absolute minutes). */
export function planTwoLoads(l1: LoadTimes, l2: LoadTimes, transfer: number, doneBy: number): TwoLoadPlan {
  const total = fullCycle(l1, l2, transfer);
  const start = doneBy - total;
  const w1End = start + l1.wash;
  const t1End = w1End + transfer;
  const d1End = t1End + l1.dry + (l1.dryMargin ?? 0);
  // Rule 4/5: stagger W2 to end at D1's longest likely finish, or start now if W2 is longer.
  const w2Start = Math.max(t1End, d1End - l2.wash);
  const w2End = w2Start + l2.wash;
  const t2Start = Math.max(w2End, d1End);
  const t2End = t2Start + transfer;
  const d2End = t2End + l2.dry + (l2.dryMargin ?? 0);
  return {
    total,
    start,
    w1End,
    t1End,
    d1End,
    w2Start,
    w2End,
    t2Start,
    t2End,
    d2End,
    l1DrawerWait: d2End - t2Start,
    wetWait: t2Start - w2End,
  };
}

/**
 * Rule 4/5: when should a wash start, given when the dryer will be free?
 * Ends the wash at the dryer's longest likely finish; if the wash is longer
 * than the remaining dry, it starts right away.
 */
export function staggeredWashStart(now: number, washMinutes: number, dryerFreeAt: number): number {
  return Math.max(now, dryerFreeAt - washMinutes);
}

// ── Done By and Eco ─────────────────────────────────────────────────────────

export interface DoneByPlan {
  feasible: boolean;
  /** Absolute minute the run should start. */
  startAt: number;
  /** Absolute finish. Equals the deadline when feasible. */
  finishAt: number;
  /** Rule 7: the earliest possible finish, offered when the deadline can't be met. */
  earliestFinish: number;
}

/** Done By without Eco: finish exactly at the deadline, or offer the earliest finish. */
export function planDoneBy(now: number, durationMin: number, deadline: number): DoneByPlan {
  const earliestFinish = now + durationMin;
  const startAt = deadline - durationMin;
  if (startAt < now) return { feasible: false, startAt: now, finishAt: earliestFinish, earliestFinish };
  return { feasible: true, startAt, finishAt: deadline, earliestFinish };
}

/** Minutes of [from, to) that fall inside the off-peak window (which may wrap midnight). */
export function offPeakOverlap(from: number, to: number, window: { start: number; end: number }): number {
  let total = 0;
  // Walk day by day; runs here are well under 48 h.
  const firstDay = Math.floor(from / DAY) - 1;
  const lastDay = Math.floor(to / DAY) + 1;
  for (let d = firstDay; d <= lastDay; d++) {
    const base = d * DAY;
    const segments =
      window.start <= window.end
        ? [[base + window.start, base + window.end]]
        : [
            [base + window.start, base + DAY],
            [base, base + window.end],
          ];
    for (const [a, b] of segments) total += Math.max(0, Math.min(to, b) - Math.max(from, a));
  }
  return total;
}

/**
 * Eco Mode: the cheapest window before the deadline.
 *
 * Done By on: the deadline is the user's time. Without Done By: the deadline
 * is the next wake-up (~6 AM), so the cheapest window closest to wake-up wins.
 * Among finishes with the most off-peak minutes, the latest one wins, so the
 * clothes come out as close to the deadline as possible.
 */
export function planEco(
  now: number,
  durationMin: number,
  deadline: number | null,
  window: { start: number; end: number },
  wakeup: number,
): DoneByPlan {
  const target = deadline ?? nextOccurrence(now + durationMin, wakeup);
  const earliestFinish = now + durationMin;
  if (target < earliestFinish) {
    return { feasible: false, startAt: now, finishAt: earliestFinish, earliestFinish };
  }
  let bestFinish = earliestFinish;
  let bestOverlap = -1;
  for (let f = Math.ceil(earliestFinish); f <= target; f++) {
    const overlap = offPeakOverlap(f - durationMin, f, window);
    if (overlap >= bestOverlap) {
      bestOverlap = overlap;
      bestFinish = f;
    }
  }
  return { feasible: true, startAt: bestFinish - durationMin, finishAt: bestFinish, earliestFinish };
}
