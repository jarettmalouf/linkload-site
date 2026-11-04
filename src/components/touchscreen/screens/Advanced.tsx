"use client";

import { activeLoad } from "@/touchscreen/app";
import { presetOf } from "@/touchscreen/programs";
import type { LoadSettings } from "@/touchscreen/types";
import { Pill, SliderRow, Toggle, settingsGrid } from "../ui";
import { TEMPS, TEMP_LABEL, cups, type ScreenProps } from "../types";

/** Advanced settings: wash and dry sliders, plus the hang-dry net. OK or tap out to close. */
export function Advanced({ app, dispatch }: ScreenProps) {
  const d = app.draft!;
  const load = activeLoad(d);
  const s = load.settings;
  const def = presetOf(load.program, load.target.kind);
  const showWash = load.target.kind === "wash";
  const showDry = d.intent !== "wash-only";
  const edit = (patch: (n: LoadSettings) => void) => {
    const next: LoadSettings = { ...s, wash: { ...s.wash }, dry: { ...s.dry } };
    patch(next);
    dispatch({ type: "EDIT", settings: next });
  };

  return (
    <div className="box-border flex h-full flex-col justify-between px-11 pb-8 pt-10">
      <div className="text-[44px] font-medium tracking-[-1px]">{s.label}</div>

      {showWash && (
        <div className="flex flex-col gap-3">
          <div className="text-[30px] text-[var(--ts-muted)]">Wash</div>
          <div className={settingsGrid}>
            <SliderRow id="temp" label="Water temp" min={0} max={2} step={1}
              value={TEMPS.indexOf(s.wash.waterTemp)} defaultValue={TEMPS.indexOf(def.wash.waterTemp)}
              display={TEMP_LABEL[s.wash.waterTemp]}
              onChange={(v) => edit((n) => { n.wash.waterTemp = TEMPS[v]; })} />
            <SliderRow id="detergent" label="Detergent" min={0} max={2} step={0.1}
              value={s.wash.detergentCups} defaultValue={def.wash.detergentCups} display={cups(s.wash.detergentCups)}
              onChange={(v) => edit((n) => { n.wash.detergentCups = v; })} />
            <SliderRow id="softener" label="Softener" min={0} max={2} step={0.1}
              value={s.wash.softenerCups} defaultValue={def.wash.softenerCups} display={cups(s.wash.softenerCups)}
              onChange={(v) => edit((n) => { n.wash.softenerCups = v; })} />
            <SliderRow id="bleach" label="Bleach" min={0} max={1} step={0.1}
              value={s.wash.bleachCups} defaultValue={def.wash.bleachCups} display={cups(s.wash.bleachCups)}
              onChange={(v) => edit((n) => { n.wash.bleachCups = v; })} />
          </div>
          <div className="flex h-14 items-center justify-between text-[25px]">
            <div>Hang-dry net in use</div>
            <Toggle label="Hang-dry net in use" on={s.wash.hangDryNet} onChange={(on) => edit((n) => { n.wash.hangDryNet = on; })} />
          </div>
        </div>
      )}

      {showWash && showDry && <div className="h-px bg-[var(--ts-line)]" />}

      {showDry && (
        <div className="flex flex-col gap-3">
          <div className="text-[30px] text-[var(--ts-muted)]">Dry</div>
          <div className={settingsGrid}>
            <SliderRow id="duration" label="Duration" min={10} max={90} step={1}
              value={s.dry.minutes} defaultValue={def.dry.minutes} display={`${s.dry.minutes} min`}
              onChange={(v) => edit((n) => { n.dry.minutes = v; })} />
            <SliderRow id="sheets" label="Dryer sheets" min={0} max={2} step={1}
              value={s.dry.dryerSheets} defaultValue={def.dry.dryerSheets} display={String(s.dry.dryerSheets)}
              onChange={(v) => edit((n) => { n.dry.dryerSheets = v; })} />
          </div>
        </div>
      )}

      <Pill height={88} className="text-[30px]" onClick={() => dispatch({ type: "BACK" })}>OK</Pill>
    </div>
  );
}
