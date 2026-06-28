// Normalized aircraft model shared across the app.
// Sourced from the public adsb.lol feed (or a custom dump1090 endpoint) and
// normalized into one stable shape regardless of upstream field naming.

export interface Aircraft {
  hex: string; // ICAO 24-bit address (stable identity)
  flight: string | null; // callsign
  registration: string | null; // tail number, e.g. N12345
  type: string | null; // ICAO type code, e.g. B738
  desc: string | null; // human type, e.g. BOEING 737-800
  operator: string | null; // owner / operator
  lat: number | null;
  lon: number | null;
  altBaro: number | null; // feet, or null; ground encoded as 0 with onGround=true
  altGeom: number | null;
  onGround: boolean;
  gs: number | null; // ground speed, knots
  ias: number | null;
  tas: number | null;
  mach: number | null;
  track: number | null; // true track, degrees
  trueHeading: number | null;
  magHeading: number | null;
  baroRate: number | null; // ft/min
  geomRate: number | null;
  squawk: string | null;
  category: string | null; // wake/size category, e.g. A3
  emergency: string | null;
  nav_altitude_mcp: number | null; // selected altitude
  nacp: number | null;
  rssi: number | null; // signal
  messages: number | null;
  seen: number | null; // seconds since last message
  seenPos: number | null;
  dbFlags: number | null; // bitmask: 1=military, 2=interesting, 4=PIA, 8=LADD
  source: string | null; // adsb_icao, mlat, tisb, etc.
  lastUpdated: number; // epoch ms when we received it
}

export interface AircraftFeed {
  aircraft: Aircraft[];
  now: number;
  total: number;
  source: string;
}

export interface Airport {
  icao: string | null;
  iata: string | null;
  name: string | null;
  municipality: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
}

export interface FlightRoute {
  callsign: string;
  origin: Airport;
  destination: Airport;
}

export interface AircraftPhoto {
  thumbnail: string;
  large: string | null;
  link: string | null;
  photographer: string | null;
}

export type TrailPoint = {
  lat: number;
  lon: number;
  alt: number | null;
  t: number;
};

export interface Settings {
  refreshMs: number;
  units: {
    speed: "kts" | "mph" | "kmh";
    altitude: "ft" | "m";
    distance: "mi" | "km" | "nm";
  };
  showMilitaryOnly: boolean;
  showEmergencyOnly: boolean;
  showLabels: boolean;
  showTrails: boolean;
  altitudeFilter: [number, number];
  source: "global" | "custom";
  customUrl: string;
}
