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
    <div className="skd-glass flex h-full flex-col overflow-hidden rounded-[18px]">
      {/* header */}
      <div className="flex items-center justify-between px-[18px] pb-3 pt-4">
        <div className="flex items-baseline gap-[9px]">
          <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", color: "#8a8178" }}>AIRCRAFT</span>
          <span className="tnum" style={{ fontWeight: 600, fontSize: 11, color: "#2e6ca6" }}>{list.length}</span>
        </div>
        <button onClick={onToggle} className="text-[#9a9085] transition hover:text-[#5a5247]" title="Hide list" aria-label="Hide list">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
      </div>

      {/* search */}
      <div
        className="mx-[16px] mb-[13px] flex h-10 items-center gap-2.5 rounded-[12px] px-[13px]"
        style={{ background: "rgba(34,28,22,0.045)", border: "1px solid rgba(34,28,22,0.07)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9a9085" strokeWidth="1.7" strokeLinecap="round">
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
          className="w-full bg-transparent text-[#221e1a] outline-none placeholder:text-[#a89e93]"
          style={{ fontWeight: 500, fontSize: 12.5 }}
        />
      </div>

      {/* sort */}
      <div className="mx-[16px] mb-[13px] flex gap-1.5">
        {(["dist", "alt", "speed", "callsign"] as SortKey[]).map((k) => {
          const active = sort === k;
          return (
            <button
              key={k}
              onClick={() => setSort(k)}
              className="flex-1 rounded-[9px] py-1.5 text-center capitalize transition"
              style={{
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.02em",
                color: active ? "#fff" : "#7c736a",
                background: active ? "#2e6ca6" : "rgba(34,28,22,0.04)",
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto" style={{ borderTop: "1px solid rgba(34,28,22,0.06)" }}>
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
              className={`flex w-full items-center gap-3 py-[11px] pl-3 pr-[14px] text-left transition ${emrg ? "skd-rowemrg" : "hover:bg-[rgba(34,28,22,0.04)]"}`}
              style={{
                borderLeft: `2px solid ${selected ? "#2e6ca6" : emrg ? "#c7453b" : "transparent"}`,
                background: selected ? "rgba(46,108,166,0.10)" : undefined,
                borderBottom: "1px solid rgba(34,28,22,0.05)",
              }}
            >
              <div className="flex-none rounded-full" style={{ width: 9, height: 9, background: emrg ? "#f87171" : band }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate" style={{ fontWeight: 600, fontSize: 14, color: selected ? "#1a2733" : "#221e1a" }}>
                    {title}
                  </span>
                  {emrg && <Tag bg="rgba(199,69,59,.14)" color="#b23a31">EMRG</Tag>}
                  {mil && !emrg && <Tag bg="rgba(176,123,28,.14)" color="#9a6a16">MIL</Tag>}
                </div>
                <div className="mt-1 truncate" style={{ fontWeight: 500, fontSize: 11, color: selected ? "#5e6b78" : "#8a8178" }}>
                  {a.type || "—"}
                  {a.operator ? ` · ${a.operator}` : ""}
                </div>
              </div>
              <div className="flex-none text-right">
                <div className="tnum" style={{ fontWeight: 600, fontSize: 13, color: selected ? "#23323f" : "#3a342d" }}>
                  {fmtAltitude(a.altBaro, settings.units, a.onGround)}
                </div>
                <div className="tnum mt-1" style={{ fontWeight: 500, fontSize: 11, color: selected ? "#5e6b78" : "#8a8178" }}>
                  {fmtSpeed(a.gs, settings.units)}
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="p-6 text-center" style={{ fontWeight: 500, fontSize: 11.5, color: "#a89e93", lineHeight: 1.6 }}>
            No aircraft in view. Pan the map, or press Enter to search globally.
          </p>
        )}
      </div>
      <div
        className="px-4 py-2 text-center uppercase"
        style={{ borderTop: "1px solid rgba(34,28,22,0.06)", fontWeight: 600, fontSize: 9, letterSpacing: "0.12em", color: "#a89e93" }}
      >
        {list.length} shown · sorted by {sort}
      </div>
    </div>
  );
}

function Tag({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="rounded-[5px] px-[5px] py-0.5" style={{ fontWeight: 600, fontSize: 8.5, letterSpacing: "0.06em", background: bg, color }}>
      {children}
    </span>
  );
}
