import { NextRequest, NextResponse } from "next/server";
import type { AircraftPhoto } from "@/lib/types";

export const runtime = "edge";

// Aircraft photo from planespotters.net (free for personal use; attribution
// required — we return the photographer + link for display).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hex: string }> }
) {
  const { hex } = await params;
  const h = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{6,7}$/.test(h)) {
    return NextResponse.json({ error: "bad hex" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://api.planespotters.net/pub/photos/hex/${h}`,
      {
        headers: { "User-Agent": "SkyDeck-Web/1.0" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    const json = await res.json();
    const first = json?.photos?.[0];
    if (!first) return NextResponse.json({ error: "not found" }, { status: 404 });
    const photo: AircraftPhoto = {
      thumbnail: first.thumbnail_large?.src ?? first.thumbnail?.src,
      large: first.thumbnail_large?.src ?? null,
      link: first.link ?? null,
      photographer: first.photographer ?? null,
    };
    return NextResponse.json(photo, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
