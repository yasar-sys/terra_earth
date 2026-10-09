import type { VariableKey } from "@/lib/climate";

const RAMPS: Record<VariableKey, [string, string]> = {
  ndvi: ["#2D3448", "#3EC98A"],
  lst: ["#2D3448", "#F2A93B"],
  temperature: ["#2D3448", "#F2A93B"],
  solar: ["#2D3448", "#F2E23B"],
  precipitation: ["#2D3448", "#7C6FF0"],
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ] as const;
}

/** Linear ramp between the variable's two stops. t is clamped to [0,1]. */
export function rampColor(variable: VariableKey, t: number, alpha = 1) {
  const [from, to] = RAMPS[variable];
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const k = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const mix = a.map((c, i) => Math.round(c + (b[i]! - c) * k));
  return `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha})`;
}

export function normalize(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || max === min) return 0;
  return (value - min) / (max - min);
}

export const TREND_COLOR = {
  rising: "var(--color-rising)",
  declining: "var(--color-declining)",
  flat: "var(--color-muted-foreground)",
} as const;

const SPECTRAL: Record<VariableKey, string[]> = {
  ndvi: ["#8C5A2B", "#D9C36A", "#9BD35A", "#2FA85A", "#0E6B3A"],
  lst: ["#2B4C9B", "#3EC9C1", "#F2E23B", "#F2A93B", "#C4544A"],
  temperature: ["#2B4C9B", "#3EC9C1", "#F2E23B", "#F2A93B", "#C4544A"],
  solar: ["#4A3B8F", "#7C6FF0", "#E06FB0", "#F2A93B", "#F2E23B"],
  precipitation: ["#F2E23B", "#9BD35A", "#3EC9C1", "#3B7BE0", "#5B3BB8"],
};

/** Multi-stop colour scale so neighbouring grid cells are easier to tell apart. */
export function spectralColor(variable: VariableKey, t: number, alpha = 1) {
  const stops = SPECTRAL[variable];
  const k = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(k));
  const a = hexToRgb(stops[i]!);
  const b = hexToRgb(stops[i + 1]!);
  const f = k - i;
  const mix = a.map((c, j) => Math.round(c + (b[j]! - c) * f));
  return `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha})`;
}

export function spectralGradient(variable: VariableKey) {
  return `linear-gradient(90deg, ${SPECTRAL[variable].join(", ")})`;
}
