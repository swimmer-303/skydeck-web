import type { Aircraft, AircraftFeed } from "./types";

// Raw upstream record. adsb.lol / airplanes.live / dump1090 share most field
// names; we read every variant we know about and normalize.
type Raw = Record<string, unknown>;

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function normalizeAircraft(raw: Raw, now: number): Aircraft {
  // alt_baro may be the literal string "ground"
  const altBaroRaw = raw.alt_baro ?? raw.altitude;
  const onGround = altBaroRaw === "ground";
  const altBaro = onGround ? 0 : num(altBaroRaw);

  return {
    hex: (str(raw.hex) ?? str(raw.icao) ?? "").toLowerCase(),
    flight: str(raw.flight),
    registration: str(raw.r) ?? str(raw.registration) ?? null,
    type: str(raw.t) ?? str(raw.type_code) ?? null,
    desc: str(raw.desc) ?? null,
    operator: str(raw.ownOp) ?? str(raw.operator) ?? null,
    lat: num(raw.lat),
    lon: num(raw.lon),
    altBaro,
    altGeom: num(raw.alt_geom),
    onGround,
    gs: num(raw.gs) ?? num(raw.speed),
    ias: num(raw.ias),
    tas: num(raw.tas),
    mach: num(raw.mach),
    track: num(raw.track) ?? num(raw.true_heading),
    trueHeading: num(raw.true_heading),
    magHeading: num(raw.mag_heading),
    baroRate: num(raw.baro_rate) ?? num(raw.vert_rate),
    geomRate: num(raw.geom_rate),
    squawk: str(raw.squawk),
    category: str(raw.category),
    emergency: str(raw.emergency),
    nav_altitude_mcp: num(raw.nav_altitude_mcp),
    nacp: num(raw.nac_p),
    rssi: num(raw.rssi),
    messages: num(raw.messages),
    seen: num(raw.seen),
    seenPos: num(raw.seen_pos),
    dbFlags: num(raw.dbFlags),
    source: str(raw.type), // adsb.lol uses "type" for the data source kind
    lastUpdated: now,
  };
}

export function normalizeFeed(json: unknown, sourceLabel: string): AircraftFeed {
  const obj = (json ?? {}) as Raw;
  const list =
    (obj.ac as Raw[]) ?? (obj.aircraft as Raw[]) ?? ([] as Raw[]);
  const now = num(obj.now) ?? Date.now();
  const aircraft = (Array.isArray(list) ? list : [])
    .map((r) => normalizeAircraft(r, now))
    .filter((a) => a.hex.length > 0);
  return {
    aircraft,
    now,
    total: num(obj.total) ?? aircraft.length,
    source: sourceLabel,
  };
}

// Public feeds cap radius at 250 nm per query.
export const MAX_RADIUS_NM = 250;

// Ordered fallback list of public ADS-B feeds. All share the same record shape
// (an `ac`/`aircraft` array + `now`), so normalizeFeed handles any of them.
// adsb.fi and airplanes.live are noticeably faster/more reliable than adsb.lol.
export function feedUrls(lat: number, lon: number, distNm: number): string[] {
  const d = Math.min(Math.max(Math.round(distNm), 1), MAX_RADIUS_NM);
  const la = lat.toFixed(4);
  const lo = lon.toFixed(4);
  return [
    `https://opendata.adsb.fi/api/v2/lat/${la}/lon/${lo}/dist/${d}`,
    `https://api.airplanes.live/v2/point/${la}/${lo}/${d}`,
    `https://api.adsb.lol/v2/lat/${la}/lon/${lo}/dist/${d}`,
  ];
}

// Ordered fallback feeds for a single search term (hex/callsign/reg/squawk).
export function searchUrls(kind: string, value: string): string[] {
  // adsb.fi & adsb.lol use the same path scheme; airplanes.live differs slightly.
  const alKind = kind === "sqk" ? "sqk" : kind === "registration" ? "reg" : kind;
  return [
    `https://opendata.adsb.fi/api/v2/${kind}/${value}`,
    `https://api.airplanes.live/v2/${alKind}/${value}`,
    `https://api.adsb.lol/v2/${kind}/${value}`,
  ];
}
