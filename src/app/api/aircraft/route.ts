import { NextRequest, NextResponse } from "next/server";
import { feedUrls, normalizeFeed } from "@/lib/adsb";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Live aircraft within a radius of a point. Proxies the public adsb.lol feed
// (avoids browser CORS, lets us swap the upstream source server-side).
//
// Query params:
//   lat, lon   — center (required for global source)
//   dist       — radius in nautical miles (default 100, capped at 250)
//   url        — optional custom dump1090/tar1090 aircraft.json endpoint
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const custom = sp.get("url");

  try {
    if (custom) {
      const upstream = await fetch(custom, {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (!upstream.ok) {
        return NextResponse.json(
          { error: `Custom source returned ${upstream.status}` },
          { status: 502 }
        );
      }
      const json = await upstream.json();
      return NextResponse.json(normalizeFeed(json, "custom"));
    }

    const lat = Number(sp.get("lat"));
    const lon = Number(sp.get("lon"));
    const dist = Number(sp.get("dist") ?? "100");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: "lat and lon are required" },
        { status: 400 }
      );
    }

    const urls = feedUrls(lat, lon, dist);
    let lastStatus = 0;
    for (const url of urls) {
      try {
        const upstream = await fetch(url, {
          cache: "no-store",
          headers: { "User-Agent": "SkyDeck-Web/1.0" },
          signal: AbortSignal.timeout(7000),
        });
        if (!upstream.ok) {
          lastStatus = upstream.status;
          continue;
        }
        const json = await upstream.json();
        const label = new URL(url).hostname.replace(/^(api|opendata)\./, "");
        return NextResponse.json(normalizeFeed(json, label), {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // try next feed
      }
    }
    return NextResponse.json(
      { error: `All feeds failed${lastStatus ? ` (last ${lastStatus})` : ""}` },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 }
    );
  }
}
