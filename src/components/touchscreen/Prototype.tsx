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
 * Lay out the machine and its screen to fit the viewport without scrolling:
 * side by side on wide screens, stacked on tall ones. Scales down, never up,
 * never distorted.
 */
/** Phones get the machine alone, with its own small screen live. */
const MOBILE_MAX_WIDTH = 768;

function useStage() {
  const [stage, setStage] = useState({ scale: 1, stacked: false, mobile: false });
  useEffect(() => {
    const fit = () => {
      const vw = window.innerWidth - 32;
      const vh = window.innerHeight - 32;
      if (window.innerWidth < MOBILE_MAX_WIDTH) {
        setStage({ scale: Math.min(1, vw / MACHINE_VIEW.width, vh / MACHINE_H), stacked: false, mobile: true });
        return;
      }
      const row = { w: MACHINE_VIEW.width + GAP + SCREEN.width, h: Math.max(SCREEN.height, MACHINE_H) };
      const col = { w: Math.max(SCREEN.width, MACHINE_VIEW.width), h: SCREEN.height + GAP + MACHINE_H };
      const rowScale = Math.min(1, vw / row.w, vh / row.h);
      const colScale = Math.min(1, vw / col.w, vh / col.h);
      setStage(colScale > rowScale ? { scale: colScale, stacked: true, mobile: false } : { scale: rowScale, stacked: false, mobile: false });
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
    return (
      <div style={{ width: MACHINE_VIEW.width * scale, height: MACHINE_H * scale }}>
        <div style={{ width: MACHINE_VIEW.width, height: MACHINE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MachineView app={app} dispatch={dispatch} screenLive />
        </div>
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
