"use client";

import { PRESET_NAME_MAX, activeLoad } from "@/touchscreen/app";
import { isCustom } from "@/touchscreen/programs";
import { Pill } from "../ui";
import type { ScreenProps } from "../types";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const key =
  "flex h-[76px] flex-1 items-center justify-center rounded-2xl border-0 bg-[var(--ts-surface)] text-[32px] text-[var(--ts-text)] active:bg-[var(--ts-line)]";

/**
 * Name a preset, e.g. "Baby clothes" or a roommate's name. It saves the
 * settings just chosen; saving a name that exists updates that preset.
 */
export function NamePreset({ app, dispatch }: ScreenProps) {
  const load = activeLoad(app.draft!);
  const editing = isCustom(load.program);
  const name = app.presetName;
  const canSave = name.trim().length > 0;

  return (
    <div className="box-border flex h-full flex-col justify-between px-7 pb-8 pt-10">
      <div className="flex flex-col gap-6 px-4">
        <div className="text-[26px] text-[var(--ts-muted)]">{editing ? "Edit preset" : "Name this preset"}</div>
        <div className="flex h-[96px] items-center border-0 border-b-2 border-solid border-[var(--ts-accent)] text-[60px] font-medium tracking-[-1.2px]" aria-live="polite">
          <span className={name ? "" : "text-[var(--ts-dim)]"}>{name || "Baby clothes"}</span>
          <span className="ml-1 h-[60px] w-[3px] animate-pulse bg-[var(--ts-accent)]" aria-hidden />
        </div>
        <div className="h-7 text-[22px] text-[var(--ts-dim)]">
          {name.length >= PRESET_NAME_MAX ? `Up to ${PRESET_NAME_MAX} letters` : "Saved on this machine for anyone to pick"}
        </div>
      </div>

      <div className="flex flex-col gap-2.5" role="group" aria-label="Keyboard">
        {ROWS.map((row, i) => (
          <div key={row} className="flex gap-2.5" style={{ paddingInline: i * 26 }}>
            {row.split("").map((c) => (
              <button key={c} type="button" className={key} onClick={() => dispatch({ type: "PRESET_KEY", key: c })}>
                {name.trim() === "" ? c.toUpperCase() : c}
              </button>
            ))}
            {i === 2 && (
              <button type="button" aria-label="Delete letter" className={`${key} max-w-[120px] flex-[1.6]`} onClick={() => dispatch({ type: "PRESET_BACKSPACE" })}>
                ⌫
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2.5 px-[120px]">
          <button type="button" aria-label="Space" className={`${key} text-[24px] text-[var(--ts-muted)]`} onClick={() => dispatch({ type: "PRESET_KEY", key: " " })}>
            space
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {editing ? (
          <Pill height={96} className="flex-1 text-[30px]" onClick={() => dispatch({ type: "DELETE_PRESET" })}>Delete</Pill>
        ) : (
          <Pill height={96} className="flex-1 text-[30px]" onClick={() => dispatch({ type: "BACK" })}>Cancel</Pill>
        )}
        <Pill
          variant={canSave ? "primary" : "secondary"}
          height={96}
          className={`flex-1 text-[30px] ${canSave ? "" : "text-[var(--ts-dim)]"}`}
          onClick={() => canSave && dispatch({ type: "SAVE_PRESET" })}
        >
          Save
        </Pill>
      </div>
    </div>
  );
}
