import type { Aircraft } from "./types";

// Altitude color bands — a richer gradient than the iOS app, tuned for a dark
// FR24-style basemap. Returns a hex color string.
export interface AltBand {
  max: number;
  color: string;
  label: string;
}

export const ALT_BANDS: AltBand[] = [
  { max: 0, color: "#9ca3af", label: "Ground" },
  { max: 1000, color: "#f87171", label: "<1k" },
  { max: 3000, color: "#fb923c", label: "1–3k" },
  { max: 6000, color: "#fbbf24", label: "3–6k" },
  { max: 10000, color: "#a3e635", label: "6–10k" },
  { max: 18000, color: "#34d399", label: "10–18k" },
  { max: 28000, color: "#22d3ee", label: "18–28k" },
  { max: 38000, color: "#60a5fa", label: "28–38k" },
  { max: Infinity, color: "#c084fc", label: "38k+" },
];

export function altitudeColor(a: Aircraft): string {
  if (a.onGround) return ALT_BANDS[0].color;
  const alt = a.altBaro ?? a.altGeom;
  if (alt == null) return "#6b7280";
  for (const band of ALT_BANDS) {
    if (alt <= band.max) return band.color;
  }
  return ALT_BANDS[ALT_BANDS.length - 1].color;
}

// Legend entries (skip the synthetic ground=0 dup at top).
export const LEGEND = ALT_BANDS.map((b) => ({
  color: b.color,
  label: b.label,
}));

export function isMilitary(a: Aircraft): boolean {
  return (a.dbFlags ?? 0) % 2 === 1;
}

export function isInteresting(a: Aircraft): boolean {
  return ((a.dbFlags ?? 0) & 2) === 2;
}

export function isEmergency(a: Aircraft): boolean {
  if (a.emergency && a.emergency !== "none") return true;
  return ["7500", "7600", "7700"].includes(a.squawk ?? "");
}
