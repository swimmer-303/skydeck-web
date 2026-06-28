import { NextRequest, NextResponse } from "next/server";
import { normalizeFeed, searchUrls } from "@/lib/adsb";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Global aircraft search by hex, callsign, or registration. Tries the most
// likely adsb.lol endpoint based on the query shape, then falls back.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toUpperCase();
  if (q.length < 2) {
    return NextResponse.json({ error: "query too short" }, { status: 400 });
  }

  // Build candidate (kind, value) pairs based on the query shape.
  const kinds: Array<[string, string]> = [];
  if (/^[0-9A-F]{6}$/.test(q)) kinds.push(["hex", q.toLowerCase()]);
  if (/^[0-7]{4}$/.test(q)) kinds.push(["sqk", q]);
  kinds.push(["registration", q]);
  kinds.push(["callsign", q]);

  for (const [kind, value] of kinds) {
    for (const url of searchUrls(kind, value)) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "SkyDeck-Web/1.0" },
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) continue;
        const json = await res.json();
        const feed = normalizeFeed(json, "adsb");
        if (feed.aircraft.length) return NextResponse.json(feed);
        break; // this feed answered (empty) — try the next kind, not the next mirror
      } catch {
        // try next mirror
      }
    }
  }
  return NextResponse.json({ aircraft: [], now: Date.now(), total: 0, source: "adsb.lol" });
}
