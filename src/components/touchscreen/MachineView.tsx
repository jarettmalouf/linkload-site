"use client";

import Image from "next/image";
import { leds, placeToggle } from "@/touchscreen/machine";
import type { PlaceId } from "@/touchscreen/types";
import { placeCaption } from "@/touchscreen/view";
import { CANVAS, TouchScreen } from "./TouchScreen";
import type { ScreenProps } from "./types";

/**
 * The machine beside its screen: the front-elevation sketch, with shading
 * for full places and soft purple LEDs on the place being set up. Tap a
 * drum or drawer to put clothes in or take them out.
 *
 * Overlay coordinates are in the sketch's own space, scaled to 756 wide
 * (the PNG is 1506 × 2457).
 */
const SKETCH = { width: 1506, height: 2457 };
const VB = { width: 756, height: (756 * SKETCH.height) / SKETCH.width };

type Shape = { kind: "rect"; x: number; y: number; w: number; h: number } | { kind: "circle"; cx: number; cy: number; r: number };

const PLACES: { id: PlaceId; name: string; shape: Shape }[] = [
  { id: "queue", name: "Queue drawer", shape: { kind: "rect", x: 160, y: 136, w: 336, h: 120 } },
  { id: "washer", name: "Washer", shape: { kind: "circle", cx: 344, cy: 463, r: 91 } },
  { id: "dryer", name: "Dryer", shape: { kind: "circle", cx: 344, cy: 848, r: 97 } },
  { id: "drawer", name: "Done drawer", shape: { kind: "rect", x: 139, y: 1041, w: 411, h: 143 } },
];

function ShapeEl({ shape, ...rest }: { shape: Shape } & React.SVGProps<SVGRectElement & SVGCircleElement>) {
  return shape.kind === "rect" ? (
    <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={6} {...rest} />
  ) : (
    <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...rest} />
  );
}

export const MACHINE_VIEW = { width: 441, imageHeight: 720 };

/**
 * The screen on the machine's control panel, in container pixels: a third of
 * the machine's width, right-aligned inside the frame, centered on the
 * machine's height (the panel between the drums).
 */
const BEZEL = 18;
// Frame: outer x 68–336, inner right edge 324, y 72–700 (without the feet).
const PANEL = { right: 318, centerY: 386, width: 89 };
const SCREEN_W = CANVAS.width + 2 * BEZEL;
const SCREEN_H = CANVAS.height + 2 * BEZEL;
const MINI_SCALE = PANEL.width / SCREEN_W;
const noop = () => {};

/** A copy of the main display on the machine. Look, don't touch. */
function MiniScreen({ app }: Pick<ScreenProps, "app">) {
  const h = SCREEN_H * MINI_SCALE;
  return (
    <div
      aria-hidden
      // inert: nothing inside can be focused or clicked (set directly; React 18 has no inert prop).
      ref={(el) => el?.setAttribute("inert", "")}
      className="pointer-events-none absolute overflow-hidden"
      style={{ left: PANEL.right - PANEL.width, top: PANEL.centerY - h / 2, width: PANEL.width, height: h }}
    >
      <div style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${MINI_SCALE})`, transformOrigin: "top left" }}>
        <TouchScreen app={app} dispatch={noop} />
      </div>
    </div>
  );
}

/** How fast each drum turns, seconds per revolution, or null when still. */
function spinPeriod(m: ScreenProps["app"]["machine"], id: PlaceId): number | null {
  if (id === "washer") return m.washer?.status === "washing" ? 2.4 : null;
  if (id === "dryer") return m.dryer?.status === "drying" ? 3.2 : m.dryer?.status === "tumbling" ? 7 : null;
  return null;
}

const center = (shape: Shape) =>
  shape.kind === "circle" ? { x: shape.cx, y: shape.cy } : { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
const ROUTE = { "to-drawer": ["dryer", "drawer"], "to-dryer": ["washer", "dryer"], "to-washer": ["queue", "washer"] } as const;

/** Where a moving load is drawn, eased from its source to its destination. */
function moving(m: ScreenProps["app"]["machine"]) {
  const t = m.transfer;
  if (!t) return null;
  const [from, to] = ROUTE[t.kind].map((id) => center(PLACES.find((p) => p.id === id)!.shape));
  const p = t.total > 0 ? Math.min(1, Math.max(0, 1 - t.remaining / t.total)) : 1;
  const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
}

export function MachineView({ app, dispatch, compact = false }: ScreenProps & { compact?: boolean }) {
  const m = app.machine;
  const lit = leds(m);
  const full: Record<PlaceId, boolean> = {
    queue: !!m.queue,
    washer: !!m.washer,
    dryer: !!m.dryer,
    drawer: !!m.drawer,
  };
  const move = moving(m);

  return (
    <div className="flex flex-col gap-5" style={{ width: MACHINE_VIEW.width }}>
      <div className="relative" style={{ width: MACHINE_VIEW.width, height: MACHINE_VIEW.imageHeight }}>
        <Image
          src="/touchscreen/machine-front.png"
          alt="LinkLoad front elevation: queue drawer, washer, dryer and done drawer"
          fill
          sizes={`${MACHINE_VIEW.width}px`}
          className="pointer-events-none select-none object-contain"
          priority
        />
        <svg viewBox={`0 0 ${VB.width} ${VB.height}`} className="absolute inset-0 h-full w-full" aria-label="Machine">
          <defs>
            <filter id="led-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            {PLACES.filter((p) => p.shape.kind === "circle").map(({ id, shape }) =>
              shape.kind === "circle" ? (
                <clipPath key={id} id={`door-${id}`}>
                  <circle cx={shape.cx} cy={shape.cy} r={shape.r + 3} />
                </clipPath>
              ) : null,
            )}
          </defs>
          {PLACES.map(({ id, name, shape }) => {
            const action = placeToggle(m, id);
            const isLit = id !== "drawer" && lit[id];
            const period = spinPeriod(m, id);
            return (
              <g key={id}>
                {/* Spinning drum: the sketch's own door art, clipped to the door and turned. */}
                {period != null && shape.kind === "circle" && (
                  <g clipPath={`url(#door-${id})`} aria-hidden>
                    <circle cx={shape.cx} cy={shape.cy} r={shape.r + 3} fill="var(--void)" />
                    <g className="mv-spin" style={{ transformOrigin: `${shape.cx}px ${shape.cy}px`, animationDuration: `${period}s` }}>
                      <image href="/touchscreen/machine-front.png" width={VB.width} height={VB.height} />
                    </g>
                  </g>
                )}
                {/* Shading: clothes inside. */}
                <ShapeEl shape={shape} fill="var(--paper)" opacity={full[id] ? 0.16 : 0} className="transition-opacity duration-500" />
                {/* LED: soft purple glow and wash while this place's load is set up. */}
                <g opacity={isLit ? 1 : 0} className="transition-opacity duration-700">
                  <ShapeEl shape={shape} fill="none" stroke="var(--signal)" strokeWidth={18} filter="url(#led-glow)" opacity={0.9} />
                  <ShapeEl shape={shape} fill="var(--signal)" opacity={0.22} />
                  <ShapeEl shape={shape} fill="none" stroke="var(--signal)" strokeWidth={3} />
                </g>
                {/* Hit area. */}
                <ShapeEl
                  shape={shape}
                  fill="transparent"
                  pointerEvents="all"
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${placeCaption(m, id)}${action ? `. Tap to ${action === "load" ? "load" : "empty"}.` : ""}`}
                  style={{ cursor: action ? "pointer" : "not-allowed", outline: "none" }}
                  onClick={() => action && dispatch({ type: "MACHINE", event: { type: action === "load" ? "LOAD_PLACE" : "EMPTY_PLACE", place: id } })}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && action) {
                      e.preventDefault();
                      dispatch({ type: "MACHINE", event: { type: action === "load" ? "LOAD_PLACE" : "EMPTY_PLACE", place: id } });
                    }
                  }}
                />
              </g>
            );
          })}
          {/* A load on its way between places. */}
          {move && (
            <g aria-hidden pointerEvents="none">
              <circle cx={move.x} cy={move.y} r={58} fill="var(--paper)" opacity={0.22} />
              <circle cx={move.x} cy={move.y} r={58} stroke="var(--paper)" strokeOpacity={0.5} strokeWidth={2} fill="none" />
            </g>
          )}
        </svg>
        <MiniScreen app={app} />
      </div>

      {!compact && <MachineInfo app={app} />}
    </div>
  );
}

/** What's in each place, and how to change it. On phones it sits under the screen instead. */
export function MachineInfo({ app, narrow = false }: Pick<ScreenProps, "app"> & { narrow?: boolean }) {
  const m = app.machine;
  const lit = leds(m);
  return (
    <div className="flex flex-col gap-5">
      <dl className={`m-0 grid ${narrow ? "grid-cols-[92px_1fr] gap-x-3 text-[12px]" : "grid-cols-[120px_1fr] gap-x-4 text-[13px]"} gap-y-1.5 font-mono leading-snug`}>
        {PLACES.map(({ id, name }) => (
          <div key={id} className="contents">
            <dt className={id !== "drawer" && lit[id] ? "text-[var(--signal)]" : "text-[var(--steel)]"}>{name}</dt>
            <dd className="m-0 text-[var(--silver)]">{placeCaption(m, id)}</dd>
          </div>
        ))}
      </dl>
      <div className={`${narrow ? "text-[12px]" : "text-[13px]"} text-[var(--steel)]`}>Tap a drum or drawer to load or empty it.</div>
    </div>
  );
}
