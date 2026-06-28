"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Aircraft, AircraftFeed, Settings, TrailPoint } from "@/lib/types";

export interface Viewport {
  lat: number;
  lon: number;
  distNm: number; // radius to request
}

interface State {
  aircraft: Aircraft[];
  byHex: Map<string, Aircraft>;
  now: number;
  total: number;
  source: string;
  connected: boolean;
  error: string | null;
  lastPoll: number | null;
}

const EMPTY: State = {
  aircraft: [],
  byHex: new Map(),
  now: 0,
  total: 0,
  source: "",
  connected: false,
  error: null,
  lastPoll: null,
};

// Polls the aircraft feed on an interval, keyed off the current viewport.
// Maintains per-hex position trails across polls for path rendering.
export function useAircraft(viewport: Viewport | null, settings: Settings) {
  const [state, setState] = useState<State>(EMPTY);
  const trails = useRef<Map<string, TrailPoint[]>>(new Map());
  const [trailVersion, setTrailVersion] = useState(0);
  const vpRef = useRef(viewport);
  vpRef.current = viewport;
  const abortRef = useRef<AbortController | null>(null);

  const poll = useCallback(async () => {
    const vp = vpRef.current;
    if (!vp && settings.source === "global") return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let url: string;
    if (settings.source === "custom" && settings.customUrl) {
      url = `/api/aircraft?url=${encodeURIComponent(settings.customUrl)}`;
    } else if (vp) {
      url = `/api/aircraft?lat=${vp.lat}&lon=${vp.lon}&dist=${Math.round(vp.distNm)}`;
    } else {
      return;
    }

    try {
      const res = await fetch(url, { signal: ac.signal });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setState((s) => ({ ...s, connected: false, error: j.error ?? `HTTP ${res.status}` }));
        return;
      }
      const feed: AircraftFeed = await res.json();
      const byHex = new Map<string, Aircraft>();
      for (const a of feed.aircraft) byHex.set(a.hex, a);

      // append to trails
      const t = trails.current;
      const now = Date.now();
      for (const a of feed.aircraft) {
        if (a.lat == null || a.lon == null) continue;
        const arr = t.get(a.hex) ?? [];
        const last = arr[arr.length - 1];
        if (!last || last.lat !== a.lat || last.lon !== a.lon) {
          arr.push({ lat: a.lat, lon: a.lon, alt: a.altBaro, t: now });
          if (arr.length > 300) arr.shift();
          t.set(a.hex, arr);
        }
      }
      // prune trails for aircraft gone for a while
      for (const [hex, arr] of t) {
        if (!byHex.has(hex) && now - (arr[arr.length - 1]?.t ?? 0) > 120000) {
          t.delete(hex);
        }
      }
      setTrailVersion((v) => v + 1);

      setState({
        aircraft: feed.aircraft,
        byHex,
        now: feed.now,
        total: feed.total,
        source: feed.source,
        connected: true,
        error: null,
        lastPoll: now,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({ ...s, connected: false, error: (err as Error).message }));
    }
  }, [settings.source, settings.customUrl]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, Math.max(1000, settings.refreshMs));
    return () => clearInterval(id);
  }, [poll, settings.refreshMs]);

  const getTrail = useCallback((hex: string) => trails.current.get(hex) ?? [], []);

  return { ...state, refresh: poll, getTrail, trailVersion };
}
