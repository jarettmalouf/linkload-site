"use client";

import { durationLabel } from "@/touchscreen/scheduler";
import type { LoadSettings } from "@/touchscreen/types";
import { LockedRow, Pill, SliderRow, settingsGrid } from "../ui";
import { TEMP_LABEL, cups, type ScreenProps } from "../types";

function Frame({ title, sub, children, actions }: { title: string; sub: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="box-border flex h-full flex-col justify-between px-11 pb-8 pt-10">
      <div className="flex flex-col gap-2 pl-[76px]">
        <div className="flex min-h-16 items-center text-[44px] font-medium tracking-[-1px]">{title}</div>
        <div className="text-[24px] text-[var(--ts-muted)]">{sub}</div>
      </div>
      {children}
      <div className="flex gap-5">{actions}</div>
    </div>
  );
}

function Gone({ dispatch, text }: { dispatch: ScreenProps["dispatch"]; text: string }) {
  return (
    <Frame title={text} sub="" actions={<Pill className="flex-1" onClick={() => dispatch({ type: "BACK" })}>Back</Pill>}>
      <div />
    </Frame>
  );
}

/** Pause first; Cancel appears once paused. */
function PauseActions({
  paused,
  place,
  dispatch,
}: {
  paused: boolean;
  place: "washer" | "dryer";
  dispatch: ScreenProps["dispatch"];
}) {
  const ev = (type: "PAUSE" | "RESUME" | "CANCEL") => dispatch({ type: "MACHINE", event: { type, place } });
  return paused ? (
    <>
      <Pill className="flex-1" onClick={() => { ev("CANCEL"); dispatch({ type: "BACK" }); }}>Cancel</Pill>
      <Pill variant="primary" className="flex-1" onClick={() => ev("RESUME")}>Resume</Pill>
    </>
  ) : (
    <>
      <Pill className="flex-1" onClick={() => ev("PAUSE")}>Pause</Pill>
      <Pill className="flex-1" onClick={() => dispatch({ type: "BACK" })}>Done</Pill>
    </>
  );
}

function DrySliders({ settings, place, dispatch, sheetsLocked }: {
  settings: LoadSettings;
  place: "washer" | "dryer";
  dispatch: ScreenProps["dispatch"];
  sheetsLocked?: boolean;
}) {
  return (
    <div className={settingsGrid}>
      <SliderRow id="duration" label="Duration" min={10} max={90} step={1} value={settings.dry.minutes}
        display={`${settings.dry.minutes} min`}
        onChange={(minutes) => dispatch({ type: "MACHINE", event: { type: "SET_DRY_MINUTES", place, minutes } })} />
      {sheetsLocked ? (
        <LockedRow label="Dryer sheets" value={String(settings.dry.dryerSheets)} />
      ) : (
        <SliderRow id="sheets" label="Dryer sheets" min={0} max={2} step={1} value={settings.dry.dryerSheets}
          display={String(settings.dry.dryerSheets)}
          onChange={(sheets) => dispatch({ type: "MACHINE", event: { type: "SET_DRYER_SHEETS", place, sheets } })} />
      )}
    </div>
  );
}

/** Wash detail: wash settings are locked once running; dry settings can still change. */
export function WashDetail({ app, dispatch }: ScreenProps) {
  const w = app.machine.washer;
  const st = w?.load.settings;
  if (!w || !st) return <Gone dispatch={dispatch} text="This load has moved on" />;
  const paused = w.status === "paused";
  const sub = w.status === "waiting" ? "Waiting to start" : paused ? "Paused" : `${durationLabel(w.remaining)} left in the wash`;
  return (
    <Frame title={st.label} sub={sub} actions={<PauseActions paused={paused} place="washer" dispatch={dispatch} />}>
      <div className="flex flex-col gap-3">
        <div className="text-[30px] text-[var(--ts-muted)]">Wash</div>
        <div className={settingsGrid}>
          <LockedRow label="Water temp" value={TEMP_LABEL[st.wash.waterTemp]} />
          <LockedRow label="Detergent" value={cups(st.wash.detergentCups)} />
          <LockedRow label="Softener" value={cups(st.wash.softenerCups)} />
          <LockedRow label="Bleach" value={cups(st.wash.bleachCups)} />
          <LockedRow label="Hang-dry net" value={st.wash.hangDryNet ? "On" : "Off"} />
        </div>
      </div>
      {w.load.plan === "wash-dry" && (
        <>
          <div className="h-px bg-[var(--ts-line)]" />
          <div className="flex flex-col gap-3">
            <div className="text-[30px] text-[var(--ts-muted)]">Dry</div>
            <DrySliders settings={st} place="washer" dispatch={dispatch} />
          </div>
        </>
      )}
    </Frame>
  );
}

/** Dry detail: what the wash was, and the current dry. */
export function DryDetail({ app, dispatch }: ScreenProps) {
  const d = app.machine.dryer;
  const st = d?.load.settings;
  if (!d || !st) return <Gone dispatch={dispatch} text="This load has moved on" />;
  const paused = d.status === "paused";
  const sub = paused ? "Paused" : d.status === "drying" ? `${durationLabel(d.remaining)} left to dry` : "Dry";
  const washed = d.load.plan === "dry-only"
    ? "Dry only"
    : `${st.label} · ${TEMP_LABEL[st.wash.waterTemp]} · ${st.wash.minutes} min${st.wash.hangDryNet ? " · hang-dry net" : ""}`;
  return (
    <Frame title={st.label} sub={sub} actions={<PauseActions paused={paused} place="dryer" dispatch={dispatch} />}>
      <div className="flex flex-col gap-3">
        <div className="text-[30px] text-[var(--ts-muted)]">Washed</div>
        <div className="text-[25px]">{washed}</div>
      </div>
      <div className="h-px bg-[var(--ts-line)]" />
      <div className="flex flex-col gap-3">
        <div className="text-[30px] text-[var(--ts-muted)]">Dry</div>
        <DrySliders settings={st} place="dryer" dispatch={dispatch} sheetsLocked />
      </div>
    </Frame>
  );
}
