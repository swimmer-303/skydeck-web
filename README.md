# SkyDeck Web ✈️

A fast, FlightRadar24-style **live flight tracker** for the web — the browser-native, globally-sourced sibling of the SkyDeck iOS app. Built with Next.js + MapLibre GL and deployable to Vercel in one click.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![MapLibre](https://img.shields.io/badge/MapLibre-GL-blue)

## What it does

- **Global live map** — real-time ADS-B aircraft positions on a smooth WebGL dark map.
- **Heading-rotated, altitude-colored aircraft** — each plane points along its track and is colored by altitude band (ground → 38k+ ft).
- **Rich detail panel** — click any aircraft for its photo, origin → destination route, full telemetry (altitude, vertical rate, speeds, track, selected altitude), identity (hex, registration, type, operator), and squawk decoding.
- **Live sidebar list** — sortable by distance / altitude / speed / callsign, with instant client-side filtering.
- **Filters & toggles** — military-only, emergency-only, labels, and flight trails.
- **Global search** — find any aircraft worldwide by callsign, registration, hex, or squawk and fly straight to it.
- **Flight trails** — historical path drawn for the selected aircraft.
- **Units & sources** — switch knots/mph/km·h, feet/meters, miles/km/nm; or point it at your own dump1090 / tar1090 receiver.

## Data sources

All free, no API keys required:

| Purpose | Source |
| --- | --- |
| Live positions | [adsb.fi](https://adsb.fi) → [airplanes.live](https://airplanes.live) → [adsb.lol](https://adsb.lol) (automatic fallback) |
| Routes | [adsbdb](https://www.adsbdb.com) |
| Photos | [planespotters.net](https://www.planespotters.net) |
| Basemap | [CARTO](https://carto.com) dark-matter (vector) |

All upstream calls are proxied through Next.js route handlers (`/api/*`) so there are no browser CORS issues and the upstream source can be swapped server-side.

> **Note:** the public feeds rate-limit large radii, so each poll requests up to ~120 nm around the current map center. Pan/zoom to load aircraft elsewhere. For unlimited local coverage, point the **Custom** data source at your own receiver.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

```bash
npx vercel        # preview
npx vercel --prod # production
```

Or import the repo at [vercel.com/new](https://vercel.com/new) — it autodetects Next.js, no configuration needed.

## Using your own receiver

Open **⚙ Settings → Data source → Custom** and enter your receiver's aircraft JSON URL, e.g.:

```
http://pi24.local/dump1090/data/aircraft.json
http://tar1090.local/data/aircraft.json
```

(The URL must be reachable from the Vercel server; for a private LAN receiver, expose it via a tunnel such as Cloudflare Tunnel.)

## Architecture

```
src/
  app/
    page.tsx              # orchestrates map + sidebar + detail + topbar
    api/
      aircraft/route.ts   # viewport feed proxy (multi-source fallback)
      route/[callsign]/   # flight route lookup (adsbdb)
      photo/[hex]/        # aircraft photo (planespotters)
      search/route.ts     # global search by hex/callsign/reg/squawk
  components/
    MapView.tsx           # MapLibre GL: SDF plane icons, trails, selection
    Sidebar.tsx           # sortable/filterable live list
    DetailPanel.tsx       # photo, route, telemetry, identity
    TopBar.tsx            # filters, units, settings popover
    Legend.tsx
  hooks/
    useAircraft.ts        # polling + per-hex trail history
    useSettings.ts        # persisted settings
  lib/
    adsb.ts               # feed URLs + normalization
    altitude.ts squawk.ts format.ts types.ts
```

Built from the SkyDeck iOS app (dump1090 poller) — reimagined as a global web app.
