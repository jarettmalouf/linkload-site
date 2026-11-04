"use client";

import Image from "next/image";
import { activeStatuses } from "@/touchscreen/view";
import type { ScreenProps } from "../types";

/** What's in the machine right now, so the main page always shows it. Purple dots are running. */
function RunningStrip({ app }: Pick<ScreenProps, "app">) {
  const lines = activeStatuses(app.machine);
  if (!lines.length) return null;
  return (
    <div className="flex shrink-0 flex-col gap-1.5 px-2" aria-live="polite">
      {lines.map((line) => (
        <div key={line.text} className="flex items-center gap-3 text-[24px] text-[var(--ts-muted)] tabular">
          <span className={`h-2.5 w-2.5 rounded-full ${line.active ? "bg-[var(--ts-accent)]" : "bg-[var(--ts-dim)]"}`} aria-hidden />
          {line.text}
        </div>
      ))}
    </div>
  );
}

const tile =
  "flex flex-[1_1_0] flex-col items-center justify-center gap-6 rounded-[40px] border-0 bg-[var(--ts-surface)] text-[var(--ts-text)]";

/** Home: two equal choices. The logo opens the full run; Wash Only below it. */
export function Home({ app, dispatch }: ScreenProps) {
  return (
    <div className="box-border flex h-full flex-col gap-5 p-7">
      <button type="button" aria-label="Wash and dry" onClick={() => dispatch({ type: "OPEN_SETUP", intent: "full-run" })} className={tile}>
        <Image src="/touchscreen/lockup-white.png" alt="LinkLoad" width={380} height={110} priority />
        <span className="text-[30px] text-[var(--ts-muted)]">Wash and dry</span>
      </button>
      <button type="button" onClick={() => dispatch({ type: "OPEN_SETUP", intent: "wash-only" })} className={tile}>
        <span className="text-[44px] font-medium tracking-[-1px]">Wash Only</span>
      </button>
      <RunningStrip app={app} />
    </div>
  );
}

/** Welcome: the first thing someone sees when the screen wakes. */
export function Welcome({ dispatch }: ScreenProps) {
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "WELCOME" })}
      className="flex h-full w-full flex-col items-center justify-center gap-12 border-0 bg-transparent text-[var(--ts-text)]"
    >
      <Image src="/touchscreen/lockup-white.png" alt="LinkLoad" width={440} height={128} priority />
      <span className="text-[34px] text-[var(--ts-muted)]">Tap to get started</span>
    </button>
  );
}

/** Nothing to set up: a quiet ready state, with anything still running underneath. */
export function Ready({ app }: Pick<ScreenProps, "app">) {
  return (
    <div className="box-border flex h-full flex-col p-7">
      <div className="flex grow flex-col items-center justify-center gap-6">
        <Image src="/touchscreen/monogram-white.png" alt="LinkLoad" width={400} height={225} priority />
        <div className="text-[26px] text-[var(--ts-muted)]">Load the washer or queue to begin</div>
      </div>
      <RunningStrip app={app} />
    </div>
  );
}
