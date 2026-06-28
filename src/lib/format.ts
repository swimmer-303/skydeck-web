import type { Settings } from "./types";

export type Units = Settings["units"];

export function fmtAltitude(
  ft: number | null | undefined,
  units: Units,
  onGround?: boolean
): string {
  if (onGround) return "Ground";
  if (ft == null) return "—";
  if (units.altitude === "m") return `${Math.round(ft * 0.3048).toLocaleString()} m`;
  return `${Math.round(ft).toLocaleString()} ft`;
}

export function fmtSpeed(kts: number | null | undefined, units: Units): string {
  if (kts == null) return "—";
  if (units.speed === "mph") return `${Math.round(kts * 1.15078)} mph`;
  if (units.speed === "kmh") return `${Math.round(kts * 1.852)} km/h`;
  return `${Math.round(kts)} kts`;
}

export function fmtDistance(km: number | null | undefined, units: Units): string {
  if (km == null) return "—";
  if (units.distance === "mi") return `${(km * 0.621371).toFixed(1)} mi`;
  if (units.distance === "nm") return `${(km * 0.539957).toFixed(1)} nm`;
  return `${km.toFixed(1)} km`;
}

export function fmtVerticalRate(fpm: number | null | undefined): string {
  if (fpm == null || Math.abs(fpm) < 32) return "Level";
  const arrow = fpm > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(Math.round(fpm)).toLocaleString()} fpm`;
}

export function fmtHeading(deg: number | null | undefined): string {
  if (deg == null) return "—";
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const i = Math.round(((deg % 360) / 22.5)) % 16;
  return `${Math.round(deg)}° ${dirs[i]}`;
}

// Haversine distance in km
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function timeAgo(epochMs: number): string {
  const s = Math.max(0, Math.round((Date.now() - epochMs) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
