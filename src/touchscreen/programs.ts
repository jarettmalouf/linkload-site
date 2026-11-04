/**
 * Picker presets. Each preset sets wash and dry together (spec: "One scroll
 * picker per load, setting wash and dry together"). Advanced settings tunes
 * them afterwards.
 */
import type {
  DryProgramId,
  LoadSettings,
  MachineConfig,
  ScanOutcome,
  WashProgramId,
  WaterTemp,
} from "./types";

type Preset = Omit<LoadSettings, "auto"> & { auto?: boolean };

const base = (
  program: LoadSettings["program"],
  label: string,
  washMin: number,
  dryMin: number,
  waterTemp: WaterTemp,
  detergentCups: number,
  softenerCups: number,
  bleachCups: number,
  dryerSheets: number,
): Preset => ({
  program,
  label,
  wash: { minutes: washMin, waterTemp, detergentCups, softenerCups, bleachCups, hangDryNet: false },
  dry: { minutes: dryMin, dryerSheets },
  dryMarginMin: 0,
});

// Dries run longer than washes on average, so a second load staggers in behind the first.
const NORMAL = base("normal", "Normal", 45, 55, "warm", 1.0, 0.5, 0, 1);

export const WASH_PRESETS: Record<WashProgramId, Preset> = {
  delicates: base("delicates", "Delicates", 40, 40, "cold", 0.6, 0.4, 0, 1),
  bedding: base("bedding", "Bedding", 60, 70, "warm", 1.2, 0.6, 0, 2),
  // Auto starts as Normal; the scan at start adjusts it.
  auto: { ...NORMAL, program: "auto", label: "Auto", auto: true },
  normal: NORMAL,
  "heavy-duty": base("heavy-duty", "Heavy Duty", 55, 65, "warm", 1.2, 0.6, 0.1, 1),
};

/** Picker order, top to bottom. Auto is the default selection. */
export const WASH_PICKER_ORDER: WashProgramId[] = ["delicates", "bedding", "auto", "normal", "heavy-duty"];

const dryOnly = (program: DryProgramId, label: string, dryMin: number, sheets: number): Preset => ({
  ...base(program, label, 0, dryMin, "cold", 0, 0, 0, sheets),
});

export const DRY_PRESETS: Record<DryProgramId, Preset> = {
  auto: { ...dryOnly("auto", "Auto", 55, 1), auto: true },
  "warm-towels": dryOnly("warm-towels", "Warm Towels", 15, 0),
  normal: dryOnly("normal", "Normal", 55, 1),
  delicates: dryOnly("delicates", "Delicates", 40, 1),
};

export const DRY_PICKER_ORDER: DryProgramId[] = ["warm-towels", "auto", "normal", "delicates"];

const clone = (p: Preset): LoadSettings => ({
  ...p,
  auto: p.auto ?? false,
  wash: { ...p.wash },
  dry: { ...p.dry },
});

export const washPreset = (id: WashProgramId): LoadSettings => clone(WASH_PRESETS[id]);
export const dryPreset = (id: DryProgramId): LoadSettings => clone(DRY_PRESETS[id]);

/** The untouched preset for a program, for the default tick on each slider. */
export const presetOf = (program: LoadSettings["program"], kind: "wash" | "dry"): LoadSettings =>
  kind === "dry" ? dryPreset(program as DryProgramId) : washPreset(program as WashProgramId);

/** Spec: hot water or bleach counts as harsh. */
export const isHarsh = (s: LoadSettings | null): boolean =>
  !!s && (s.wash.waterTemp === "hot" || s.wash.bleachCups > 0);

/**
 * Apply the Auto scan, which runs right after start.
 * - confident: keeps the tuned settings, no margin.
 * - unsure: leans gentle (one step cooler) and adds the longest-likely margin.
 * - fail: runs as Normal.
 * Non-Auto loads are returned unchanged.
 */
export function applyAutoScan(
  s: LoadSettings,
  outcome: ScanOutcome,
  config: Pick<MachineConfig, "autoUnsureMarginMin">,
  dryOnlyLoad = false,
): LoadSettings {
  if (!s.auto) return s;
  if (outcome === "fail") {
    const normal = dryOnlyLoad ? dryPreset("normal") : washPreset("normal");
    return { ...normal, wash: { ...normal.wash, hangDryNet: s.wash.hangDryNet } };
  }
  if (outcome === "confident") return { ...s, dryMarginMin: 0 };
  const cooler: Record<WaterTemp, WaterTemp> = { hot: "warm", warm: "cold", cold: "cold" };
  return {
    ...s,
    wash: { ...s.wash, waterTemp: cooler[s.wash.waterTemp] },
    dryMarginMin: config.autoUnsureMarginMin,
  };
}

/**
 * The estimate used before the scan has run (e.g. Done By preview).
 * Conservative: assume the scan will be unsure.
 */
export function preScanEstimate(
  s: LoadSettings,
  config: Pick<MachineConfig, "autoUnsureMarginMin">,
): LoadSettings {
  return s.auto ? applyAutoScan(s, "unsure", config) : s;
}
