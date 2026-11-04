"use client";

import { clearanceView, finishView, movingText, proTipText, sleepView } from "@/touchscreen/view";
import { Pill } from "../ui";
import type { ScreenProps } from "../types";
import { MoveAnim } from "./Animations";

const machine = (dispatch: ScreenProps["dispatch"], type: "HANG_DRY_YES" | "HANG_DRY_SKIP" | "HANG_DRY_RESUME" | "PRO_TIP_FINE" | "PRO_TIP_NOTIFY" | "RESUME_AFTER_FAILURE" | "FINISH_OK") =>
  () => dispatch({ type: "MACHINE", event: { type } });

/** Sleep: the countdown that was on screen, readable across the room. Nothing when idle. */
export function Sleep({ app }: ScreenProps) {
  const view = sleepView(app.machine);
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[var(--ts-bg)]">
      {view && (
        <>
          <div className="h-10 text-[32px] text-[var(--ts-dim)]">{view.label}</div>
          <div className="text-[248px] font-light leading-[1.1] tracking-[-8px] text-[var(--ts-sleep)] tabular">{view.big}</div>
        </>
      )}
    </div>
  );
}

/**
 * Moves between places, one at a time: dry clothes drift like autumn leaves
 * into the done drawer, wet clothes fall dripping into the dryer, and the
 * queued load drops into the washer.
 */
export function Transfer({ app }: ScreenProps) {
  const t = app.machine.transfer;
  if (!t) return null;
  return (
    <div className="box-border flex h-full flex-col items-center justify-center gap-11 p-14">
      <MoveAnim key={t.kind} kind={t.kind} />
      <div className="max-w-[620px] text-balance text-center text-[38px] font-medium leading-[1.2] tracking-[-0.5px]">{movingText(t)}</div>
    </div>
  );
}

/** Hang-dry window: 30-second countdown after the wash transfers out. */
export function HangDry({ app, dispatch }: ScreenProps) {
  const h = app.machine.hangDry!;
  const total = app.machine.config.hangDryWindowSec;
  const left = Math.max(0, Math.ceil(h.secondsLeft));
  const r = 140;
  const circumference = 2 * Math.PI * r;

  if (h.unlocked) {
    return (
      <div className="box-border flex h-full flex-col justify-between px-11 pb-11 pt-16">
        <div className="flex flex-col gap-7 px-3">
          <div className="text-[62px] font-medium leading-[1.1] tracking-[-1.6px]">The drum is unlocked</div>
          <div className="text-[30px] leading-[1.35] text-[var(--ts-muted)]">Take your hang-dry clothes out of the net, close the door, then resume.</div>
        </div>
        <Pill variant="primary" onClick={machine(dispatch, "HANG_DRY_RESUME")}>Resume</Pill>
      </div>
    );
  }

  return (
    <div className="box-border flex h-full flex-col items-center justify-between px-11 pb-11 pt-14">
      <div className="text-center text-[54px] font-medium leading-[1.12] tracking-[-1.2px]">Pull your hang-dry clothes?</div>
      <div className="relative flex h-[300px] w-[300px] items-center justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none" aria-hidden className="absolute inset-0 -rotate-90">
          <circle cx="150" cy="150" r={r} stroke="var(--ts-line)" strokeWidth="8" />
          <circle
            cx="150" cy="150" r={r} stroke="var(--ts-accent)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - h.secondsLeft / total)}
            className="transition-[stroke-dashoffset] duration-200 ease-linear"
          />
        </svg>
        <div className="text-[104px] font-light tracking-[-2px] tabular" aria-live="polite">0:{String(left).padStart(2, "0")}</div>
      </div>
      <div className="flex w-full gap-5">
        <Pill className="flex-1" onClick={machine(dispatch, "HANG_DRY_SKIP")}>Skip</Pill>
        <Pill variant="primary" className="flex-1" onClick={machine(dispatch, "HANG_DRY_YES")}>Yes</Pill>
      </div>
    </div>
  );
}

/** Hang-dry pro tip: shown at start when the next load is harsh. */
export function ProTip({ app, dispatch }: ScreenProps) {
  return (
    <div className="box-border flex h-full flex-col px-11 pb-11 pt-16">
      <div className="flex grow flex-col justify-center gap-7 px-3">
        <div className="text-[28px] font-medium text-[var(--ts-accent)]">Pro tip</div>
        <div className="text-[62px] font-medium leading-[1.1] tracking-[-1.6px]">Take out your hang-dry clothes before your next load runs</div>
        <div className="text-[30px] leading-[1.35] text-[var(--ts-muted)]">{proTipText(app.machine)}</div>
      </div>
      <div className="flex gap-5">
        <Pill className="flex-1" onClick={machine(dispatch, "PRO_TIP_FINE")}>It&apos;s Fine</Pill>
        <Pill variant="primary" className="flex-1" onClick={machine(dispatch, "PRO_TIP_NOTIFY")}>Notify Me</Pill>
      </div>
    </div>
  );
}

/** Finish: every completed load gets one, then the main page returns on its own. */
export function Finish({ app, dispatch }: ScreenProps) {
  const view = finishView(app.machine);
  if (!view) return null;
  return (
    <div className="box-border flex h-full flex-col justify-between px-14 pb-11 pt-[120px]">
      <div className="flex flex-col gap-8">
        <svg width="112" height="112" viewBox="0 0 112 112" fill="none" aria-hidden>
          <circle cx="56" cy="56" r="52" stroke="var(--ts-text)" strokeWidth="3" />
          <path d="M34 57l15 15 29-31" stroke="var(--ts-text)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-[72px] font-medium leading-[1.08] tracking-[-2px]">{view.title}</div>
        <div className="text-[30px] leading-[1.35] text-[var(--ts-muted)]">{view.sub}</div>
      </div>
      <Pill onClick={machine(dispatch, "FINISH_OK")}>OK</Pill>
    </div>
  );
}

/**
 * After Start, when something has to be emptied first. No dismiss button:
 * it goes away by itself once the dryer and/or done drawer are empty.
 */
export function ClearanceModal({ app }: ScreenProps) {
  const view = clearanceView(app.machine);
  if (!view) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--ts-bg)_82%,transparent)] p-7" role="alertdialog" aria-modal aria-label={view.title}>
      <div className="flex w-full flex-col gap-5 rounded-[40px] bg-[var(--ts-surface)] px-12 py-14">
        <div className="text-[56px] font-medium leading-[1.08] tracking-[-1.6px]">{view.title}</div>
        <div className="text-[28px] leading-[1.4] text-[var(--ts-muted)]">{view.sub}</div>
      </div>
    </div>
  );
}

/** Transfer failed: plain instructions, Resume once moved. */
export function Failed({ dispatch }: ScreenProps) {
  const steps = ["Open the washer door", "Move the last garments to the dryer", "Close both doors"];
  return (
    <div className="box-border flex h-full flex-col justify-between px-14 pb-11 pt-[60px]">
      <div className="text-[64px] font-medium leading-[1.1] tracking-[-1.6px]">Your load needs a hand</div>
      <ol className="m-0 flex list-none flex-col gap-[30px] p-0 text-[34px] leading-[1.25]">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-6">
            <span className="w-9 text-[var(--ts-muted)]">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <Pill variant="primary" onClick={machine(dispatch, "RESUME_AFTER_FAILURE")}>Resume</Pill>
    </div>
  );
}
