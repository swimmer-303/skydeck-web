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
  onToggle?: () => void;
}

type SortKey = "dist" | "alt" | "speed" | "callsign";

export default function Sidebar({ aircraft, selectedHex, settings, home, onSelect, onSearch, onToggle }: Props) {
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
    <div className="skd-glass flex h-full flex-col overflow-hidden rounded-[15px]">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-[11px] pt-[15px]">
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", color: "#8a98a8" }}>
            AIRCRAFT
          </span>
          <span className="font-mono-tab" style={{ fontWeight: 600, fontSize: 11, color: "#2BD4F5" }}>
            {list.length}
          </span>
        </div>
        <button onClick={onToggle} className="text-[#7a8a9a] transition hover:text-white" title="Hide list" aria-label="Hide list">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
      </div>

      {/* search */}
      <div
        className="mx-[14px] mb-3 flex h-[38px] items-center gap-[9px] rounded-[10px] px-3"
        style={{ background: "rgba(4,8,13,0.55)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6f7e8e" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) onSearch(query.trim());
          }}
          placeholder="Search callsign, type, squawk…"
          className="w-full bg-transparent text-[#e9f0f7] outline-none placeholder:text-[#5d6b7a]"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 12 }}
        />
      </div>

      {/* sort */}
      <div className="mx-[14px] mb-3 flex gap-1">
        {(["dist", "alt", "speed", "callsign"] as SortKey[]).map((k) => {
          const active = sort === k;
          return (
            <button
              key={k}
              onClick={() => setSort(k)}
              className="flex-1 rounded-[7px] py-[5px] text-center capitalize transition"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: 9.5,
                letterSpacing: "0.04em",
                color: active ? "#04121a" : "#6f7e8e",
                background: active ? "linear-gradient(180deg,#33d6f5,#16b4d6)" : "rgba(255,255,255,0.03)",
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto border-t border-white/[0.05]">
        {list.map((a) => {
          const title = a.flight?.trim() || a.registration || a.hex.toUpperCase();
          const emrg = isEmergency(a);
          const mil = isMilitary(a);
          const band = altitudeColor(a);
          const selected = selectedHex === a.hex;
          return (
            <button
              key={a.hex}
              onClick={() => onSelect(a.hex)}
              className={`flex w-full items-center gap-[11px] py-[9px] pl-[11px] pr-[13px] text-left transition ${emrg ? "skd-rowemrg" : "hover:bg-white/5"}`}
              style={{
                borderLeft: `2px solid ${selected ? "#2BD4F5" : emrg ? "#ef4444" : "transparent"}`,
                background: selected ? "rgba(45,212,245,0.10)" : undefined,
                borderBottom: "1px solid rgba(255,255,255,0.035)",
              }}
            >
              <div
                className="flex-none rounded-[2px]"
                style={{ width: 3, height: 30, background: emrg ? "#f87171" : band, boxShadow: `0 0 7px ${emrg ? "rgba(248,113,113,.6)" : band}` }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[7px]">
                  <span className="truncate" style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 13.5, color: "#e9f0f7", letterSpacing: "0.01em" }}>
                    {title}
                  </span>
                  {emrg && <Tag bg="rgba(239,68,68,.18)" color="#fca5a5">EMRG</Tag>}
                  {mil && !emrg && <Tag bg="rgba(245,158,11,.16)" color="#fbbf24">MIL</Tag>}
                </div>
                <div className="mt-1 truncate" style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 10.5, color: "#6f7e8e", letterSpacing: "0.02em" }}>
                  {a.type || "—"}
                  {a.operator ? ` · ${a.operator}` : ""}
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="font-mono-tab" style={{ fontWeight: 600, fontSize: 12.5, color: "#cdd9e6" }}>
                  {fmtAltitude(a.altBaro, settings.units, a.onGround)}
                </div>
                <div className="mt-1 font-mono-tab" style={{ fontWeight: 500, fontSize: 10.5, color: "#7a8a9a" }}>
                  {fmtSpeed(a.gs, settings.units)}
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="p-6 text-center" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#566472", lineHeight: 1.6 }}>
            No aircraft in view. Pan the map, or press Enter to search globally.
          </p>
        )}
      </div>
      <div
        className="border-t border-white/[0.05] px-4 py-2 text-center uppercase"
        style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "#566472" }}
      >
        {list.length} shown · sorted by {sort}
      </div>
    </div>
  );
}

function Tag({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-[3px] px-1 py-0.5"
      style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 8, letterSpacing: "0.1em", background: bg, color }}
    >
      {children}
    </span>
  );
}
