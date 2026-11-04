"use client";

import { useMemo, useRef } from "react";
import { TIME_STEP, draftPreview, timingStatus } from "@/touchscreen/app";
import { clock12 } from "@/touchscreen/scheduler";
import { Pill, Toggle } from "../ui";
import type { ScreenProps } from "../types";

const INFO = {
  eco: {
    title: "Eco Mode",
    body: "Eco Mode runs your loads at the most ecologically and economically advantageous time, when energy demand is lowest.",
  },
  "done-by": {
    title: "Done By",
    body: "Schedule your load to complete at a certain time. Best for loads where wrinkles are a major concern.",
  },
} as const;

const wrap = (m: number) => ((m % 1440) + 1440) % 1440;
const ampm = (m: number) => (m >= 720 ? "PM" : "AM");
const snap = (m: number) => Math.round(m / TIME_STEP) * TIME_STEP;

function InfoButton({ topic, dispatch }: { topic: "eco" | "done-by"; dispatch: ScreenProps["dispatch"] }) {
  return (
    <button
      type="button"
      aria-label={`About ${INFO[topic].title}`}
      onClick={() => dispatch({ type: "INFO", topic })}
      className="h-11 w-11 rounded-full border-[1.5px] border-[var(--ts-dim)] bg-transparent text-[22px] text-[var(--ts-muted)]"
    >
      i
    </button>
  );
}

function TimeWheel({ time, dispatch }: { time: number; dispatch: ScreenProps["dispatch"] }) {
  const drag = useRef<number | null>(null);
  const wheel = useRef(0);
  const nudge = (dir: number) => dispatch({ type: "TIMING_TIME", time: snap(time) + dir * TIME_STEP });
  return (
    <div
      role="spinbutton"
      aria-label="Time"
      aria-valuetext={`${clock12(time)} ${ampm(time)}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") nudge(-1);
        if (e.key === "ArrowDown") nudge(1);
      }}
      onWheel={(e) => {
        wheel.current += e.deltaY;
        if (Math.abs(wheel.current) > 40) {
          nudge(Math.sign(wheel.current));
          wheel.current = 0;
        }
      }}
      onPointerDown={(e) => {
        drag.current = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current == null) return;
        const dy = e.clientY - drag.current;
        if (Math.abs(dy) > 44) {
          nudge(dy > 0 ? -1 : 1);
          drag.current = e.clientY;
        }
      }}
      onPointerUp={() => (drag.current = null)}
      className="flex touch-none flex-col items-center gap-1"
    >
      <button type="button" tabIndex={-1} onClick={() => nudge(-1)}
        className="border-0 bg-transparent text-[34px] font-light text-[var(--ts-dim)] tabular">
        {clock12(wrap(snap(time) - TIME_STEP))}
      </button>
      <div className="text-[148px] font-light leading-[1.1] tracking-[-4px] tabular">
        {clock12(time)}
        <span className="ml-3 text-[44px] tracking-normal">{ampm(time)}</span>
      </div>
      <button type="button" tabIndex={-1} onClick={() => nudge(1)}
        className="border-0 bg-transparent text-[34px] font-light text-[var(--ts-dim)] tabular">
        {clock12(wrap(snap(time) + TIME_STEP))}
      </button>
    </div>
  );
}

/**
 * Done By first; its time picker shows only while it's on. Eco Mode works on
 * its own (cheapest window by morning) or with Done By (cheapest window
 * before that time).
 */
export function DoneBy({ app, dispatch }: ScreenProps) {
  const d = app.draft!;
  const { doneBy, eco, time } = d.timing;
  const minute = Math.floor(app.machine.now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => draftPreview(app), [d, minute]);
  const status = timingStatus(app, preview);

  return (
    <div className="relative box-border flex h-full flex-col justify-between p-11">
      <div className="flex flex-col gap-6">
        {(["done-by", "eco"] as const).map((topic) => (
          <div key={topic} className="flex h-[72px] items-center justify-between">
            <div className="flex items-center gap-3.5 text-[34px]">
              {INFO[topic].title}
              <InfoButton topic={topic} dispatch={dispatch} />
            </div>
            <Toggle size="lg" label={INFO[topic].title} on={topic === "eco" ? eco : doneBy} onChange={() => dispatch({ type: "TIMING_TOGGLE", which: topic })} />
          </div>
        ))}
      </div>

      {doneBy ? <TimeWheel time={time} dispatch={dispatch} /> : <div />}

      <div className="flex flex-col gap-[22px]">
        <div className="h-8 text-center text-[26px] text-[var(--ts-muted)]">{status}</div>
        <Pill variant="primary" height={104} onClick={() => dispatch({ type: "SET_DONE_BY" })}>
          Set
        </Pill>
      </div>

      {app.info && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--ts-bg)_80%,transparent)] p-7"
          onClick={() => dispatch({ type: "INFO", topic: null })}
        >
          <div className="flex w-full flex-col gap-5 rounded-[40px] bg-[var(--ts-surface)] p-10" onClick={(e) => e.stopPropagation()}>
            <div className="text-[40px] font-medium tracking-[-1px]">{INFO[app.info].title}</div>
            <div className="text-[28px] leading-[1.4] text-[var(--ts-muted)]">{INFO[app.info].body}</div>
            <Pill variant="ghost" height={88} className="mt-2 bg-[var(--ts-bg)] text-[30px]" onClick={() => dispatch({ type: "INFO", topic: null })}>
              OK
            </Pill>
          </div>
        </div>
      )}
    </div>
  );
}
