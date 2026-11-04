"use client";

/**
 * Touchscreen primitives, sized for the 786 × 852 canvas. Sizes come from
 * the mockups in docs/touchscreen/screens; colors from the site tokens.
 */
import { useRef, type ReactNode } from "react";

export function Pill({
  children,
  onClick,
  variant = "secondary",
  className = "",
  height = 112,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  height?: number;
}) {
  const look =
    variant === "primary"
      ? "bg-[var(--ts-accent)] text-[var(--ts-on-accent)]"
      : variant === "secondary"
        ? "bg-[var(--ts-surface)] text-[var(--ts-text)]"
        : "bg-transparent text-[var(--ts-text)]";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height, borderRadius: height / 2 }}
      className={`border-0 text-[32px] font-medium ${look} ${className}`}
    >
      {children}
    </button>
  );
}

export function RoundButton({
  label,
  onClick,
  primary = false,
  size = 104,
  children,
}: {
  label: string;
  onClick?: () => void;
  primary?: boolean;
  size?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`flex items-center justify-center border-0 ${
        primary ? "bg-[var(--ts-accent)] text-[var(--ts-on-accent)]" : "bg-[var(--ts-surface)] text-[var(--ts-text)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  on,
  onChange,
  label,
  size = "md",
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const [w, h, knob, pad] = size === "lg" ? [104, 60, 48, 6] : [88, 48, 38, 5];
  return (
    <div
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!on);
        }
      }}
      style={{ width: w, height: h, padding: pad, borderRadius: h / 2 }}
      className={`box-border flex cursor-pointer transition-colors duration-300 ${
        on ? "justify-end bg-[var(--ts-accent)]" : "justify-start bg-[var(--ts-line)]"
      }`}
    >
      <div
        style={{ width: knob, height: knob, borderRadius: knob / 2 }}
        className={on ? "bg-[var(--ts-bg)]" : "bg-[var(--ts-muted)]"}
      />
    </div>
  );
}

export function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
  defaultValue,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
  /** The program's default, marked with a small tick so it's easy to return to. */
  defaultValue?: number;
}) {
  const frac = defaultValue == null ? null : Math.min(1, Math.max(0, (defaultValue - min) / (max - min)));
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        {frac != null && (
          // Thumb is 32px wide, so its center travels from 16px to (100% − 16px).
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-[22px] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ts-dim)]"
            style={{ left: `calc(16px + (100% - 32px) * ${frac})` }}
          />
        )}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative block"
        />
      </div>
      <div className="text-right text-[var(--ts-muted)] tabular">{display}</div>
    </>
  );
}

/** A read-only row in the same grid as SliderRow, for locked settings. */
export function LockedRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-[var(--ts-muted)]">{label}</div>
      <div />
      <div className="text-right text-[var(--ts-muted)] tabular">{value}</div>
    </>
  );
}

export const settingsGrid = "grid grid-cols-[180px_minmax(0,1fr)_124px] items-center gap-x-5 gap-y-2.5 text-[25px]";

/**
 * Vertical scroll picker. Tap a neighbor, drag, scroll, or use the arrow
 * keys. The selected row sits in the accent pill.
 */
export function ScrollPicker<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  const wheel = useRef(0);
  const go = (delta: number) => {
    const next = Math.min(options.length - 1, Math.max(0, index + delta));
    if (next !== index) onChange(options[next].id);
  };

  const rows = [-2, -1, 0, 1, 2].map((offset) => ({ offset, option: options[index + offset] }));

  return (
    <div
      role="listbox"
      aria-label={label}
      aria-activedescendant={`opt-${value}`}
      tabIndex={0}
      className="flex w-full touch-none flex-col items-center gap-2.5 outline-none"
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") go(-1);
        if (e.key === "ArrowDown") go(1);
      }}
      onWheel={(e) => {
        wheel.current += e.deltaY;
        if (Math.abs(wheel.current) > 40) {
          go(Math.sign(wheel.current));
          wheel.current = 0;
        }
      }}
      onPointerDown={(e) => {
        drag.current = { y: e.clientY, moved: false };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dy = e.clientY - drag.current.y;
        if (Math.abs(dy) > 56) {
          go(dy > 0 ? -1 : 1);
          drag.current = { y: e.clientY, moved: true };
        }
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      {rows.map(({ offset, option }) => {
        const far = Math.abs(offset) === 2;
        if (offset === 0) {
          return (
            <div
              key="selected"
              id={`opt-${value}`}
              role="option"
              aria-selected
              className="my-1.5 box-border flex h-[148px] w-[620px] items-center justify-center rounded-[74px] border-2 border-[var(--ts-accent)] text-[76px] font-medium tracking-[-1.5px]"
            >
              {option?.label}
            </div>
          );
        }
        return (
          <div
            key={offset}
            role={option ? "option" : undefined}
            aria-selected={option ? false : undefined}
            onClick={() => option && !drag.current?.moved && go(offset)}
            className={`flex items-center justify-center transition-colors duration-200 ${
              far ? "h-[38px] text-[30px] text-[var(--ts-dim)]" : "h-[50px] text-[40px] text-[var(--ts-muted)]"
            } ${option ? "cursor-pointer" : ""}`}
          >
            {option?.label ?? ""}
          </div>
        );
      })}
    </div>
  );
}

// ── Icons (from the mockups) ────────────────────────────────────────────────

export const ClockIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const PlayIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
  </svg>
);

export const SlidersIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);
