"use client";

import { useId } from "react";
import type { TransferKind } from "@/touchscreen/types";

/**
 * Illustrated loops. Washing and drying fill the whole Progress tile behind
 * the numbers: clothes drift around, bubbles rise (wash) or heat wafts up
 * (dry). Moves between places get their own falls: wet clothes dripping
 * into the dryer, dry clothes drifting like autumn leaves into the done
 * drawer, the queued load dropping into the washer. Motion lives in
 * touchscreen.css and stops under prefers-reduced-motion.
 */

const SHIRT = "M-14 -12 L-6 -16 Q0 -11 6 -16 L14 -12 L19 -3 L12 0 L12 15 L-12 15 L-12 0 L-19 -3 Z";
const SOCK = "M-5 -15 L4 -15 L4 3 Q4 8 9 8 L11 8 Q16 9 15 14 Q14 17 9 17 L-1 17 Q-6 17 -6 11 Z";
const LEAF = "M0 -11 C 8 -6, 8 6, 0 11 C -8 6, -8 -6, 0 -11 Z";
const DROP = "M0 -6 C 3 -2, 4 1, 4 3 A 4 4 0 0 1 -4 3 C -4 1, -3 -2, 0 -6 Z";

/** The tile's own coordinate space; the SVG covers the tile without distortion. */
const TILE = { w: 730, h: 390 };

type Garment = { d: string; drift: 1 | 2 | 3; dur: number; delay: number; scale: number };

function Garments({ items, opacity }: { items: Garment[]; opacity: number }) {
  return (
    <>
      {items.map((g, i) => (
        <g
          key={i}
          className={`ts-drift-${g.drift}`}
          style={{ animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` }}
        >
          <path d={g.d} transform={`scale(${g.scale})`} stroke="var(--ts-sleep)" strokeWidth={2.4 / g.scale} strokeLinejoin="round" opacity={opacity} />
        </g>
      ))}
    </>
  );
}

function TileSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${TILE.w} ${TILE.h}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  x: 24 + ((i * 397) % 690),
  r: 3 + ((i * 7) % 6),
  dur: 5 + ((i * 13) % 5),
  delay: -((i * 1.7) % 8),
  sway: ((i % 2 ? 1 : -1) * (10 + ((i * 11) % 20))),
}));

/** Washing: clothes tumble around the tile while bubbles rise through it. */
export function TileWash() {
  return (
    <TileSvg>
      {BUBBLES.map((b, i) => (
        <circle
          key={i}
          className="ts-rise"
          cx={b.x}
          cy={TILE.h + 12}
          r={b.r}
          stroke="var(--ts-bubble)"
          strokeWidth="1.8"
          style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, ["--sway" as string]: `${b.sway}px` }}
        />
      ))}
      <Garments
        opacity={0.5}
        items={[
          { d: SHIRT, drift: 1, dur: 13, delay: 0, scale: 2.6 },
          { d: SOCK, drift: 2, dur: 11, delay: -4, scale: 2.2 },
          { d: SHIRT, drift: 3, dur: 15, delay: -9, scale: 2 },
        ]}
      />
    </TileSvg>
  );
}

const WISPS = Array.from({ length: 9 }, (_, i) => ({
  x: 50 + i * 79,
  dur: 3.4 + ((i * 7) % 4) * 0.5,
  delay: -((i * 0.9) % 3.6),
}));

/** Drying: clothes float lazily while heat wafts up across the tile. */
export function TileDry() {
  return (
    <TileSvg>
      {WISPS.map((w, i) => (
        <path
          key={i}
          className="ts-waft"
          d={`M${w.x} ${TILE.h - 20} q 9 -14 0 -28 t 0 -28 t 0 -28`}
          stroke="var(--ts-heat)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}
        />
      ))}
      <Garments
        opacity={0.5}
        items={[
          { d: SHIRT, drift: 2, dur: 20, delay: 0, scale: 2.6 },
          { d: SOCK, drift: 3, dur: 18, delay: -6, scale: 2.2 },
        ]}
      />
    </TileSvg>
  );
}

// ── Moves between places ────────────────────────────────────────────────────

const VIEW = { w: 340, h: 560 };
const TOP = 150;
const BOTTOM = 410;

function Place({ shape, cy }: { shape: "drum" | "drawer"; cy: number }) {
  return shape === "drum" ? (
    <circle cx={VIEW.w / 2} cy={cy} r="130" stroke="var(--ts-line)" strokeWidth="3" />
  ) : (
    <rect x="30" y={cy - 55} width={VIEW.w - 60} height="110" rx="22" stroke="var(--ts-line)" strokeWidth="3" />
  );
}

const FALLERS = [
  { x: 150, delay: 0, dx: 26, scale: 2.3, tone: 0 },
  { x: 186, delay: 0.5, dx: -22, scale: 1.8, tone: 1 },
  { x: 166, delay: 1.0, dx: 18, scale: 2.1, tone: 2 },
  { x: 140, delay: 1.5, dx: -16, scale: 1.6, tone: 1 },
  { x: 196, delay: 2.0, dx: 20, scale: 1.9, tone: 0 },
  { x: 174, delay: 2.5, dx: -24, scale: 2.2, tone: 2 },
];
const LEAF_TONES = ["var(--ts-leaf-1)", "var(--ts-leaf-2)", "var(--ts-leaf-3)"];

const SCENE: Record<TransferKind, { top: "drum" | "drawer"; bottom: "drum" | "drawer"; label: string }> = {
  "to-drawer": { top: "drum", bottom: "drawer", label: "Dry clothes drifting from the dryer drum into the done drawer" },
  "to-dryer": { top: "drum", bottom: "drum", label: "Wet clothes falling from the washer drum into the dryer drum" },
  "to-washer": { top: "drawer", bottom: "drum", label: "The queued load dropping from the queue drawer into the washer drum" },
};

export function MoveAnim({ kind }: { kind: TransferKind }) {
  const scene = SCENE[kind];
  const mid = (TOP + BOTTOM) / 2;
  return (
    <svg width={VIEW.w} height={VIEW.h} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} fill="none" role="img" aria-label={scene.label}>
      <Place shape={scene.top} cy={TOP} />
      <Place shape={scene.bottom} cy={BOTTOM} />
      {FALLERS.map((f) =>
        kind === "to-drawer" ? (
          // Autumn leaves: slow, swaying.
          <g key={f.delay} className="ts-leaf" style={{ animationDelay: `${f.delay}s`, ["--dx" as string]: `${f.dx}px` }}>
            <g transform={`translate(${f.x} ${mid}) scale(${f.scale})`}>
              <path d={LEAF} fill={LEAF_TONES[f.tone]} />
              <path d="M0 -9 L0 13" stroke="var(--ts-bg)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            </g>
          </g>
        ) : (
          // Clothes: a heavier, straighter fall. Wet ones drip as they go.
          <g key={f.delay} className="ts-fall" style={{ animationDelay: `${f.delay * 0.8}s`, ["--dx" as string]: `${f.dx * 0.5}px` }}>
            <g transform={`translate(${f.x} ${mid})`}>
              <path d={f.tone === 1 ? SOCK : SHIRT} transform={`scale(${f.scale * 0.75})`} stroke="var(--ts-sleep)" strokeWidth={2.4 / (f.scale * 0.75)} strokeLinejoin="round" />
              {kind === "to-dryer" &&
                [-10, 6, 16].map((x, i) => (
                  <g key={x} className="ts-drip" style={{ animationDelay: `${f.delay * 0.8 + i * 0.25}s` }}>
                    <path d={DROP} transform={`translate(${x} ${20 + i * 6}) scale(${1.1 - i * 0.15})`} fill="var(--ts-water)" />
                  </g>
                ))}
            </g>
          </g>
        ),
      )}
    </svg>
  );
}

// ── Waiting: two hourglasses ────────────────────────────────────────────────

const GLASS = "M-20 -37 C-20 -12, -4 -7, -4 0 C-4 7, -20 12, -20 37 L20 37 C20 12, 4 7, 4 0 C4 -7, 20 -12, 20 -37 Z";

/**
 * One hourglass. The glass flips every few seconds; the sand is drawn in
 * screen space (not flipped with the glass), so the top bulb always drains
 * into the bottom one and refills as the glass turns over.
 */
function Hourglass({ dir }: { dir: "cw" | "ccw" }) {
  // Unique per instance: the mini screen on the machine draws these too.
  const id = `hg${useId().replace(/:/g, "")}`;
  return (
    <svg width="56" height="92" viewBox="-28 -46 56 92" fill="none" aria-hidden>
      <defs>
        <clipPath id={id}>
          <path d={GLASS} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect className="ts-sand-top" x="-22" y="-30" width="44" height="28" fill="var(--ts-heat)" opacity="0.55" />
        <rect className="ts-sand-bottom" x="-22" y="8" width="44" height="29" fill="var(--ts-heat)" opacity="0.55" />
        <line className="ts-sand-stream" x1="0" y1="-2" x2="0" y2="34" stroke="var(--ts-heat)" strokeWidth="1.5" opacity="0.55" />
      </g>
      <g className={`ts-flip-${dir}`}>
        <path d={GLASS} stroke="var(--ts-sleep)" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="-26" y="-43" width="52" height="6" rx="2" fill="var(--ts-sleep)" />
        <rect x="-26" y="37" width="52" height="6" rx="2" fill="var(--ts-sleep)" />
      </g>
    </svg>
  );
}

/** Waiting: an hourglass on each side, flipping together in opposite directions. */
export function TileWait() {
  return (
    <>
      <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 opacity-70">
        <Hourglass dir="cw" />
      </span>
      <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 opacity-70">
        <Hourglass dir="ccw" />
      </span>
    </>
  );
}
