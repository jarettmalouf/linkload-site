import type { AppAction, AppState } from "@/touchscreen/app";
import type { LoadSettings, WaterTemp } from "@/touchscreen/types";

export interface ScreenProps {
  app: AppState;
  dispatch: (a: AppAction) => void;
}

export const TEMP_LABEL: Record<WaterTemp, string> = { cold: "Cold", warm: "Warm", hot: "Hot" };
export const TEMPS: WaterTemp[] = ["cold", "warm", "hot"];
export const cups = (n: number) => `${n.toFixed(1)} cups`;

/** Program label for a load, falling back when settings aren't known yet. */
export const loadLabel = (s: LoadSettings | null | undefined) => s?.label ?? "Load";
