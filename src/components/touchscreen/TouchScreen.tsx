"use client";

import { showWelcome, userBrowsing } from "@/touchscreen/app";
import { baseScreen, overlayScreen } from "@/touchscreen/screens";
import { Advanced } from "./screens/Advanced";
import { DryDetail, WashDetail } from "./screens/Detail";
import { DoneBy } from "./screens/DoneBy";
import { Home, Ready, Welcome } from "./screens/Home";
import { Progress } from "./screens/Progress";
import { ClearanceModal, Failed, Finish, HangDry, ProTip, Sleep, Transfer } from "./screens/Prompts";
import { NamePreset } from "./screens/NamePreset";
import { Setup } from "./screens/Setup";
import type { ScreenProps } from "./types";

export const CANVAS = { width: 786, height: 852 };

/** Picks the screen: machine overlays first, then the user's flow, then welcome, then the resting screen. */
function Current(props: ScreenProps) {
  const { app } = props;
  switch (overlayScreen(app.machine, userBrowsing(app))) {
    case "failed": return <Failed {...props} />;
    case "pro-tip": return <ProTip {...props} />;
    case "hang-dry": return <HangDry {...props} />;
    case "transfer": return <Transfer {...props} />;
    case "finish": return <Finish {...props} />;
    case "sleep": return <Sleep {...props} />;
  }
  switch (app.nav.at(-1)) {
    case "setup": return <Setup {...props} />;
    case "advanced": return <Advanced {...props} />;
    case "name-preset": return <NamePreset {...props} />;
    case "done-by": return <DoneBy {...props} />;
    case "wash-detail": return <WashDetail {...props} />;
    case "dry-detail": return <DryDetail {...props} />;
  }
  if (showWelcome(app)) return <Welcome {...props} />;
  switch (baseScreen(app.machine)) {
    case "home": return <Home {...props} />;
    case "progress": return <Progress {...props} />;
    case "ready": return <Ready {...props} />;
    // Dry Only opens automatically (app.step); this covers the frame before it does.
    case "dry-only": return <Ready {...props} />;
  }
}

/** The fixed 786 × 852 screen inside its bezel. Any touch counts as someone being there. */
export function TouchScreen(props: ScreenProps) {
  return (
    <div className="ts-bezel">
      <div
        className="ts relative overflow-hidden rounded-[28px]"
        style={CANVAS}
        onPointerDownCapture={() => props.dispatch({ type: "MACHINE", event: { type: "TOUCH" } })}
      >
        <Current {...props} />
        {!userBrowsing(props.app) && overlayScreen(props.app.machine) == null && <ClearanceModal {...props} />}
      </div>
    </div>
  );
}
