import { NextRequest, NextResponse } from "next/server";
import type { Airport, FlightRoute } from "@/lib/types";

export const runtime = "edge";

// Flight route (origin → destination) from adsb.lol's route endpoint, with an
// adsbdb fallback. Cached aggressively since routes are static per callsign.
interface AdsbAirport {
  iata_code?: string;
  icao_code?: string;
  name?: string;
  municipality?: string;
  countryName?: string;
  country_name?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
}

function toAirport(a: AdsbAirport | undefined): Airport {
  return {
    icao: a?.icao_code ?? null,
    iata: a?.iata_code ?? null,
    name: a?.name ?? null,
    municipality: a?.municipality ?? null,
    country: a?.countryName ?? a?.country_name ?? null,
    lat: a?.lat ?? a?.latitude ?? null,
    lon: a?.lon ?? a?.longitude ?? null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ callsign: string }> }
) {
  const { callsign } = await params;
  const cs = callsign.trim().toUpperCase();
  if (cs.length < 3) {
    return NextResponse.json({ error: "bad callsign" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.adsbdb.com/v0/callsign/${cs}`, {
      headers: { "User-Agent": "SkyDeck-Web/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const json = await res.json();
    const fr = json?.response?.flightroute;
    if (!fr) return NextResponse.json({ error: "not found" }, { status: 404 });
    const route: FlightRoute = {
      callsign: cs,
      origin: toAirport(fr.origin),
      destination: toAirport(fr.destination),
    };
    return NextResponse.json(route, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
