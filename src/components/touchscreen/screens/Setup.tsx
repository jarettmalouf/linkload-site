"use client";

import { useMemo } from "react";
import { activeLoad, canQueueInSetup, draftPreview, pickerOptions, setupNote, timingAvailable } from "@/touchscreen/app";
import { programLabel } from "@/touchscreen/programs";
import type { ProgramId } from "@/touchscreen/types";
import { ClockIcon, PlayIcon, RoundButton, ScrollPicker, SlidersIcon } from "../ui";
import type { ScreenProps } from "../types";

const HEADER = {
  "full-run": "Wash and dry",
  "wash-only": "Wash only",
  "dry-only": "Dry only",
  "queue-another": "Queued load",
} as const;

const PLACE = { washer: "Washer", queue: "Queue", dryer: "Dryer" } as const;

/** Load setup (and Dry Only): one picker, starting on Auto. Queue Another adds a load; one Start runs them all. */
export function Setup({ app, dispatch }: ScreenProps) {
  const d = app.draft!;
  const load = activeLoad(d);
  const kind = load.target.kind;
  const options = pickerOptions(app, kind).map((id) => ({
    id,
    label: programLabel(id, kind, app.machine.presets),
  }));
  const minute = Math.floor(app.machine.now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => draftPreview(app), [d, minute]);
  const note = setupNote(app, preview);
  const multi = d.loads.length > 1;

  return (
    <div className="box-border flex h-full flex-col items-center justify-between px-7 pb-10 pt-11">
      <div className="flex flex-col items-center gap-3">
        <div className="text-[26px] text-[var(--ts-muted)]">{HEADER[d.intent]}</div>
        {multi && (
          <div className="flex gap-3" role="tablist" aria-label="Loads">
            {d.loads.map((l, i) => (
              <button
                key={l.target.place}
                type="button"
                role="tab"
                aria-selected={i === d.active}
                onClick={() => dispatch({ type: "SELECT_LOAD", index: i })}
                className={`flex h-12 items-center gap-2 rounded-3xl border-2 bg-[var(--ts-surface)] px-5 text-[22px] ${
                  i === d.active ? "border-[var(--ts-accent)] text-[var(--ts-text)]" : "border-transparent text-[var(--ts-muted)]"
                }`}
              >
                {PLACE[l.target.place]} · {l.settings.label}
                {i > 0 && (
                  <span
                    role="button"
                    aria-label={`Remove ${PLACE[l.target.place].toLowerCase()} load`}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "REMOVE_LOAD", index: i });
                    }}
                    className="ml-1 text-[var(--ts-dim)]"
                  >
                    ✕
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="h-[26px] text-[22px] text-[var(--ts-dim)]">{note}</div>
      </div>

      <ScrollPicker<ProgramId>
        label="Load type"
        options={options}
        value={load.program}
        onChange={(program) => dispatch({ type: "PICK", program })}
      />

      <div className="flex flex-col items-center gap-5">
        <div className="h-12">
          {canQueueInSetup(app) && (
            <button
              type="button"
              onClick={() => dispatch({ type: "QUEUE_IN_SETUP" })}
              className="h-12 rounded-3xl border-0 bg-transparent px-6 text-[26px] font-medium text-[var(--ts-text)]"
            >
              + Queue Another
            </button>
          )}
        </div>
        <div className="flex items-center gap-11">
          {timingAvailable(d) ? (
            <RoundButton label="Done By" onClick={() => dispatch({ type: "OPEN", screen: "done-by" })}>
              <ClockIcon />
            </RoundButton>
          ) : (
            <div className="h-[104px] w-[104px]" aria-hidden />
          )}
          <RoundButton label={multi ? "Start both loads" : "Start"} primary size={148} onClick={() => dispatch({ type: "START" })}>
            <PlayIcon />
          </RoundButton>
          <RoundButton label="Advanced settings" onClick={() => dispatch({ type: "OPEN", screen: "advanced" })}>
            <SlidersIcon />
          </RoundButton>
        </div>
      </div>
    </div>
  );
}
