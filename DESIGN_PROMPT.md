# SkyDeck — Design Brief for Claude Design

## What this is

SkyDeck is a **real-time global flight tracker** — a live map of every aircraft in
the sky, streamed from ADS-B data. The entire experience is a single full-screen
**WebGL map** (MapLibre) with floating UI panels layered on top. There are no
scrolling pages; it's a dense, always-live operator console in the spirit of
Flightradar24, but cleaner and more modern.

Redesign the **chrome** — the panels, controls, and visual system that float over
the map. **Do not redesign the map tiles themselves.** The map stays a dark
basemap; everything you design sits on top of it.

## The problem with today's design

The current UI works but feels generic and slapped-together: plain dark gray
rounded rectangles (`bg-neutral-950/90`), hairline white rings, emoji icons
(🛫, ⚙, ☰), and no real identity. It looks like an unstyled prototype. I want a
design with a point of view — something that feels like a premium aviation
instrument, not a default Tailwind dashboard.

## Design goals

1. **Aviation-grade & precise** — evoke a glass cockpit / air-traffic-control
   feel. Crisp, technical, data-dense but legible. Tabular numbers, tight
   tracking, confident hierarchy.
2. **Dark, map-first** — the map is the star. UI panels must read clearly over a
   busy moving map without stealing focus. Use translucency, blur, and subtle
   elevation rather than heavy solid blocks.
3. **A real identity** — give SkyDeck a distinct accent palette, typography, and
   iconography. Replace all emoji with proper icons.
4. **Calm until it matters** — neutral by default, but emergency and military
   states should pop with clear, urgent color.

## Layout (keep this structure — restyle it)

Full-viewport map with these floating overlays:

- **Top bar** (top-left, floating glass pill): logo + wordmark, live-connection
  status dot, aircraft count, and toggle chips — **MIL**, **EMRG**, **Labels**,
  **Trails** — plus a **Settings** button that opens a popover (refresh interval,
  speed/altitude/distance units, data source).
- **Sidebar** (left, below top bar): a scrollable, searchable list of nearby
  aircraft — callsign, type, altitude, speed, distance. Selectable rows.
- **Detail panel** (right, appears when an aircraft is selected): photo,
  callsign/registration, route (origin → destination), live telemetry
  (altitude, ground speed, heading, squawk), and a "Follow" action.
- **Altitude legend** (bottom-left): a color key mapping altitude bands to colors.

## Visual system

### Color
Keep the **altitude color ramp** — it's functional data encoding, ground → high:
`#9ca3af` ground · `#f87171` <1k · `#fb923c` 1–3k · `#fbbf24` 3–6k · `#a3e635`
6–10k · `#34d399` 10–18k · `#22d3ee` 18–28k · `#60a5fa` 28–38k · `#c084fc` 38k+.

Around that, design a cohesive neutral + accent system:
- **Surfaces**: deep near-black, translucent with backdrop blur. Give panels a
  subtle layered depth (soft inner highlight + faint border) instead of a flat ring.
- **Primary accent**: pick a confident sky/cyan-leaning blue as the brand accent
  (current ad-hoc accent is `#0ea5e9`/`sky-500` — refine it).
- **Alert states**: military = amber (`#f59e0b`), emergency = red (`#ef4444`).
  These must feel genuinely urgent when active (glow, fill, pulse for emergencies).
- **Live status dot**: green when connected, red when disconnected.

### Typography
Propose a type system suited to dense telemetry. Want a clean geometric/grotesk
sans for UI, and a **monospaced or tabular** treatment for all numbers (altitude,
speed, coordinates, squawk) so they don't jitter as they update. Define clear
sizes for: wordmark, panel titles, row primary/secondary text, tiny labels
(uppercase tracked microcopy like "ALTITUDE").

### Iconography
Replace every emoji with a consistent line-icon set: a plane mark for the logo,
hamburger/list, gear/settings, close, follow/crosshair, search. Outline style,
~1.5px stroke, matching the technical feel.

### Toggle chips & controls
Design the toggle chip states (idle / hover / active) — active should fill with
the relevant accent (amber for MIL, red for EMRG, brand blue for others). Design
the settings popover, segmented unit controls, search input, and list-row
selected/hover states as a coherent set.

## Deliverables I'd like from Claude Design

- A restyled **top bar** with logo lockup and toggle chips.
- The **sidebar** aircraft-list row (default / hover / selected).
- The **detail panel** for a selected aircraft.
- The **altitude legend**.
- A small **style tile**: color tokens, type scale, icon set, elevation/blur
  treatment for glass panels.

Show everything composited over a **dark map background** so contrast and
legibility are real, not on a blank canvas.

## Logo — placeholder for now

> **TODO (not yet):** Replace the current `🛫` emoji and "SkyDeck" wordmark with
> the **real SkyDeck logo from `coding/skydeck`**. For this design pass, use a
> tasteful placeholder plane mark + wordmark lockup, but lay it out so the real
> logo can drop straight in (define the clear-space and the wordmark pairing).

## Constraints

- Built with **Next.js + Tailwind CSS v4**, React 19, MapLibre GL. Output should
  be expressible in Tailwind utility classes / standard CSS.
- Must stay readable over a moving, high-contrast map — lean on blur + translucency.
- Performance matters: this is a real-time app updating every few seconds. Avoid
  heavy effects that would fight constant repaints.
