"use client";

import { useEffect, useReducer, useState } from "react";
import { createApp, step } from "@/touchscreen/app";
import { SCENES, type SceneName } from "@/touchscreen/scenes";
import type { NotebookBits } from "@/touchscreen/types";
import { MACHINE_VIEW, MachineView } from "./MachineView";
import { CANVAS, TouchScreen } from "./TouchScreen";

const BEZEL = 18;
const GAP = 56;
const SCREEN = { width: CANVAS.width + 2 * BEZEL, height: CANVAS.height + 2 * BEZEL };
const MACHINE_H = MACHINE_VIEW.imageHeight + 150;

/**
 * Phones: the machine (with its mirrored mini screen) takes the left third,
 * and the screen you use takes the rest, each scaled on its own.
 */
const MOBILE_MAX_WIDTH = 768;
const MOBILE_GAP = 12;

interface Stage {
  scale: number;
  stacked: boolean;
  /** Phone layout: separate scales for the machine and the screen. */
  mobile: { machine: number; screen: number } | null;
}

/**
 * Lay out the machine and its screen to fit the viewport without scrolling:
 * side by side on wide screens, stacked on tall ones. Scales down, never up,
 * never distorted.
 */
function useStage() {
  const [stage, setStage] = useState<Stage>({ scale: 1, stacked: false, mobile: null });
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth - 32;
      const vh = window.innerHeight - 32;
      if (window.innerWidth < MOBILE_MAX_WIDTH) {
        const left = (vw - MOBILE_GAP) / 3;
        const right = vw - MOBILE_GAP - left;
        setStage({
          scale: 1,
          stacked: false,
          mobile: {
            machine: Math.min(1, left / MACHINE_VIEW.width, vh / MACHINE_VIEW.imageHeight),
            screen: Math.min(1, right / SCREEN.width, vh / SCREEN.height),
          },
        });
        return;
      }
      const row = { w: MACHINE_VIEW.width + GAP + SCREEN.width, h: Math.max(SCREEN.height, MACHINE_H) };
      const col = { w: Math.max(SCREEN.width, MACHINE_VIEW.width), h: SCREEN.height + GAP + MACHINE_H };
      const rowScale = Math.min(1, vw / row.w, vh / row.h);
      const colScale = Math.min(1, vw / col.w, vh / col.h);
      setStage(colScale > rowScale ? { scale: colScale, stacked: true, mobile: null } : { scale: rowScale, stacked: false, mobile: null });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return stage;
}

export function Prototype({
  mode,
  scene,
  speed: initialSpeed = 60,
  paused = false,
}: {
  mode: NotebookBits;
  scene?: SceneName;
  speed?: number;
  /** Freeze both clocks (for screenshots). */
  paused?: boolean;
}) {
  const [app, dispatch] = useReducer(step, null, () => (scene ? SCENES[scene]() : createApp(mode)));
  const [speed] = useState(initialSpeed);
  const { scale, stacked, mobile } = useStage();

  // The only clock: report elapsed real time; the machine decides what it means.
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "TICK", realSec: (now - last) / 1000, speed });
      last = now;
    }, 100);
    return () => window.clearInterval(id);
  }, [speed, paused]);

  if (mobile) {
    const fit = (w: number, h: number, k: number, child: React.ReactNode) => (
      <div className="shrink-0" style={{ width: w * k, height: h * k }}>
        <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: "top left" }}>{child}</div>
      </div>
    );
    return (
      <div className="flex items-center" style={{ gap: MOBILE_GAP }}>
        {/* Too small to read there, so the captions are left off. */}
        {fit(MACHINE_VIEW.width, MACHINE_VIEW.imageHeight, mobile.machine, <MachineView app={app} dispatch={dispatch} compact />)}
        {fit(SCREEN.width, SCREEN.height, mobile.screen, <TouchScreen app={app} dispatch={dispatch} />)}
      </div>
    );
  }

  const w = stacked ? Math.max(SCREEN.width, MACHINE_VIEW.width) : MACHINE_VIEW.width + GAP + SCREEN.width;
  const h = stacked ? SCREEN.height + GAP + MACHINE_H : Math.max(SCREEN.height, MACHINE_H);

  return (
    <div style={{ width: w * scale, height: h * scale }}>
      <div
        className={`flex ${stacked ? "flex-col-reverse items-center" : "flex-row items-start"}`}
        style={{ width: w, height: h, gap: GAP, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <MachineView app={app} dispatch={dispatch} />
        <TouchScreen app={app} dispatch={dispatch} />
      </div>
    </div>
  );
}
