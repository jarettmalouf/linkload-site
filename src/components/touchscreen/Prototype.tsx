"use client";

import { useEffect, useReducer, useState } from "react";
import { createApp, step } from "@/touchscreen/app";
import { SCENES, type SceneName } from "@/touchscreen/scenes";
import type { NotebookBits } from "@/touchscreen/types";
import { MACHINE_VIEW, MachineInfo, MachineView } from "./MachineView";
import { CANVAS, TouchScreen } from "./TouchScreen";

const BEZEL = 18;
const PRESETS_KEY = "linkload-touchscreen-presets";
const GAP = 56;
const SCREEN = { width: CANVAS.width + 2 * BEZEL, height: CANVAS.height + 2 * BEZEL };
const MACHINE_H = MACHINE_VIEW.imageHeight + 150;

/**
 * Phones: the top third holds the machine (with its mirrored mini screen)
 * beside the status list; the bottom two thirds hold the screen you use, as
 * wide as the phone allows.
 */
const MOBILE_MAX_WIDTH = 768;
const MOBILE_GAP = 12;
/** The machine takes at most this share of the top row's width; the status list gets the rest. */
const MOBILE_MACHINE_SHARE = 0.48;

interface Stage {
  scale: number;
  stacked: boolean;
  /** Phone layout: separate scales for the machine and the screen, and the full width. */
  mobile: { machine: number; screen: number; width: number } | null;
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
        const screen = Math.min(1, vw / SCREEN.width, ((vh - MOBILE_GAP) * 2) / 3 / SCREEN.height);
        const top = vh - MOBILE_GAP - SCREEN.height * screen;
        const machine = Math.min(1, top / MACHINE_VIEW.imageHeight, (vw * MOBILE_MACHINE_SHARE) / MACHINE_VIEW.width);
        setStage({ scale: 1, stacked: false, mobile: { machine, screen, width: vw } });
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

  // Presets saved on this machine live in this browser between visits. Best effort: storage may be blocked.
  const presets = app.machine.presets;
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PRESETS_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length) dispatch({ type: "MACHINE", event: { type: "SET_PRESETS", presets: saved } });
    } catch {
      // Nothing saved, or storage unavailable.
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
      // Storage unavailable: presets last until the page closes.
    }
  }, [presets, restored]);

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
      <div className="flex flex-col" style={{ gap: MOBILE_GAP, width: mobile.width }}>
        <div className="flex items-center" style={{ gap: MOBILE_GAP }}>
          {fit(MACHINE_VIEW.width, MACHINE_VIEW.imageHeight, mobile.machine, <MachineView app={app} dispatch={dispatch} compact />)}
          {/* Readable size, not scaled with the drawing. */}
          <div className="min-w-0 grow">
            <MachineInfo app={app} narrow />
          </div>
        </div>
        <div className="flex justify-center">{fit(SCREEN.width, SCREEN.height, mobile.screen, <TouchScreen app={app} dispatch={dispatch} />)}</div>
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
