"use client";

import { useMemo, useState } from "react";
import type { Aircraft, Settings } from "@/lib/types";
import { fmtAltitude, fmtSpeed, distanceKm } from "@/lib/format";
import { altitudeColor, isEmergency, isMilitary } from "@/lib/altitude";

interface Props {
  aircraft: Aircraft[];
  selectedHex: string | null;
  settings: Settings;
  home: { lat: number; lon: number } | null;
  onSelect: (hex: string) => void;
  onSearch: (q: string) => void;
}

type SortKey = "dist" | "alt" | "speed" | "callsign";

export default function Sidebar({ aircraft, selectedHex, settings, home, onSelect, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("dist");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = aircraft;
    if (q) {
      arr = arr.filter(
        (a) =>
          a.hex.includes(q) ||
          a.flight?.toLowerCase().includes(q) ||
          a.registration?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q) ||
          a.operator?.toLowerCase().includes(q)
      );
    }
    const withDist = (a: Aircraft) =>
      home && a.lat != null && a.lon != null ? distanceKm(home.lat, home.lon, a.lat, a.lon) : Infinity;
    const sorted = [...arr];
    sorted.sort((x, y) => {
      switch (sort) {
        case "alt":
          return (y.altBaro ?? -1) - (x.altBaro ?? -1);
        case "speed":
          return (y.gs ?? -1) - (x.gs ?? -1);
        case "callsign":
          return (x.flight || x.hex).localeCompare(y.flight || y.hex);
        default:
          return withDist(x) - withDist(y);
      }
    });
    return sorted;
  }, [aircraft, query, sort, home]);

  return (
    <div className="flex h-full flex-col bg-neutral-950/95 backdrop-blur">
      <div className="p-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) onSearch(query.trim());
            }}
            placeholder="Search callsign, reg, hex, type…"
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-600 outline-none ring-1 ring-white/10 focus:ring-sky-500"
          />
        </div>
        <div className="mt-2 flex gap-1 text-xs">
          {(["dist", "alt", "speed", "callsign"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded px-2 py-1 capitalize ${
                sort === k ? "bg-sky-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-500">{list.length} aircraft shown</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.map((a) => {
          const title = a.flight?.trim() || a.registration || a.hex.toUpperCase();
          return (
            <button
              key={a.hex}
              onClick={() => onSelect(a.hex)}
              className={`flex w-full items-center gap-3 border-b border-white/5 px-3 py-2 text-left hover:bg-white/5 ${
                selectedHex === a.hex ? "bg-sky-500/15" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: isEmergency(a) ? "#ef4444" : altitudeColor(a) }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">{title}</span>
                  {isMilitary(a) && <span className="text-[10px] font-bold text-amber-500">MIL</span>}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {a.type || "—"} {a.operator ? `· ${a.operator}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs tabular-nums text-neutral-300">
                  {fmtAltitude(a.altBaro, settings.units, a.onGround)}
                </div>
                <div className="text-[11px] tabular-nums text-neutral-500">
                  {fmtSpeed(a.gs, settings.units)}
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="p-4 text-center text-sm text-neutral-600">
            No aircraft. Pan the map or press Enter to search globally.
          </p>
        )}
      </div>
    </div>
  );
}
