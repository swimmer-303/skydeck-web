"use client";

import { useEffect, useState } from "react";
import type { Aircraft, AircraftPhoto, FlightRoute, Settings } from "@/lib/types";
import { distanceKm } from "@/lib/format";
import { altitudeColor, isEmergency, isMilitary } from "@/lib/altitude";
import { decodeSquawk } from "@/lib/squawk";

interface Props {
  aircraft: Aircraft;
  settings: Settings;
  home: { lat: number; lon: number } | null;
  onClose: () => void;
  onFollow: () => void;
}

export default function DetailPanel({ aircraft, settings, home, onClose, onFollow }: Props) {
  const [photo, setPhoto] = useState<AircraftPhoto | null>(null);
  const [route, setRoute] = useState<FlightRoute | null>(null);
  const a = aircraft;

  useEffect(() => {
    setPhoto(null);
    let active = true;
    fetch(`/api/photo/${a.hex}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => active && p && setPhoto(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [a.hex]);

  useEffect(() => {
    setRoute(null);
    const cs = a.flight?.trim();
    if (!cs || cs.length < 3) return;
    let active = true;
    fetch(`/api/route/${encodeURIComponent(cs)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rt) => active && rt && setRoute(rt))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [a.flight]);

  const emrg = isEmergency(a);
  const mil = isMilitary(a);
  const band = emrg ? "#ef4444" : altitudeColor(a);
  const sq = decodeSquawk(a.squawk);
  const title = a.flight?.trim() || a.registration || a.hex.toUpperCase();
  const status = emrg ? "EMERGENCY" : a.onGround ? "ON GROUND" : "EN ROUTE";

  const dist =
    home && a.lat != null && a.lon != null ? distanceKm(home.lat, home.lon, a.lat, a.lon) : null;

  // Metric display values
  const altUnit = settings.units.altitude;
  const altVal = a.onGround
    ? "GND"
    : a.altBaro == null
    ? "—"
    : (altUnit === "m" ? Math.round(a.altBaro * 0.3048) : Math.round(a.altBaro)).toLocaleString();
  const spdUnit = settings.units.speed === "kts" ? "kt" : settings.units.speed === "mph" ? "mph" : "km/h";
  const spdVal =
    a.gs == null
      ? "—"
      : settings.units.speed === "mph"
      ? Math.round(a.gs * 1.15078)
      : settings.units.speed === "kmh"
      ? Math.round(a.gs * 1.852)
      : Math.round(a.gs);
  const distUnit = settings.units.distance;
  const distVal =
    dist == null
      ? "—"
      : distUnit === "mi"
      ? (dist * 0.621371).toFixed(1)
      : distUnit === "nm"
      ? (dist * 0.539957).toFixed(1)
      : dist.toFixed(1);
  const vrate = a.baroRate;
  const vrateColor = vrate == null || Math.abs(vrate) < 32 ? "#eaf2f9" : vrate > 0 ? "#34d399" : "#f87171";
  const vrateVal =
    vrate == null || Math.abs(vrate) < 32 ? "0" : `${vrate > 0 ? "+" : "−"}${Math.abs(Math.round(vrate)).toLocaleString()}`;

  // Rough route progress from great-circle distances
  let progressW = "50%";
  if (
    route?.origin.lat != null &&
    route?.origin.lon != null &&
    route?.destination.lat != null &&
    route?.destination.lon != null &&
    a.lat != null &&
    a.lon != null
  ) {
    const dOrig = distanceKm(route.origin.lat, route.origin.lon, a.lat, a.lon);
    const dDest = distanceKm(route.destination.lat, route.destination.lon, a.lat, a.lon);
    const f = dOrig / Math.max(1, dOrig + dDest);
    progressW = `${Math.min(96, Math.max(4, f * 100))}%`;
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[15px]"
      style={{
        background: "linear-gradient(180deg,rgba(15,21,30,0.92),rgba(10,15,22,0.96))",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07),0 24px 60px -12px rgba(0,0,0,0.8)",
      }}
    >
      {/* photo header */}
      <div
        className="relative flex-none"
        style={{ height: 158, background: photo ? undefined : "repeating-linear-gradient(135deg,#0e151d 0 13px,#11181f 13px 26px)" }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.large ?? photo.thumbnail} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        {!photo && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 10, letterSpacing: "0.22em", color: "#3b4754" }}
          >
            AIRCRAFT&nbsp;PHOTO
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,rgba(8,12,18,0.1) 0%,rgba(8,12,18,0.05) 45%,rgba(10,15,22,0.96) 100%)" }}
        />

        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex items-center justify-center rounded-[8px] text-[#aebccb] backdrop-blur transition hover:text-white"
          style={{ width: 30, height: 30, background: "rgba(8,12,18,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
          aria-label="Close"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* band + status */}
        <div
          className="absolute left-[14px] top-[13px] flex items-center gap-[7px] rounded-[7px] px-[9px] py-[5px] backdrop-blur"
          style={{ background: "rgba(8,12,18,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span
            className={emrg ? "skd-rowemrg" : ""}
            style={{ width: 8, height: 8, borderRadius: "50%", background: band, boxShadow: `0 0 8px ${band}` }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 9, letterSpacing: "0.14em", color: emrg ? "#fecaca" : "#bcc9d6" }}>
            {status}
          </span>
          {mil && (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 8, letterSpacing: "0.1em", color: "#fbbf24" }}>· MIL</span>
          )}
        </div>

        {/* callsign overlay */}
        <div className="absolute bottom-[13px] left-4 right-4">
          <div className="flex items-end justify-between gap-2.5">
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 26, letterSpacing: "0.005em", color: "#f1f6fb", lineHeight: 1 }}>
              {title}
            </div>
            {a.registration && (
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, letterSpacing: "0.08em", color: "#8a98a8", paddingBottom: 2 }}>
                {a.registration}
              </div>
            )}
          </div>
          <div className="mt-[5px] truncate" style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 11, letterSpacing: "0.04em", color: "#7a8a9a" }}>
            {a.desc || a.type || "Unknown type"}
            {a.operator ? ` · ${a.operator}` : ""}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* route */}
        {route && (
          <div className="px-4 pb-1 pt-4">
            <div className="flex items-center gap-3">
              <div>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 22, color: "#eaf2f9", letterSpacing: "0.02em", lineHeight: 1 }}>
                  {route.origin.iata || route.origin.icao || "—"}
                </div>
                <div className="mt-1 max-w-[88px] truncate" style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 9.5, letterSpacing: "0.06em", color: "#6f7e8e" }}>
                  {route.origin.municipality || ""}
                </div>
              </div>
              <div className="relative mx-0.5 mb-4 h-0.5 flex-1 rounded-[2px]" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="absolute left-0 top-0 h-0.5 rounded-[2px]"
                  style={{ width: progressW, background: "linear-gradient(90deg,rgba(45,212,245,0.2),#2BD4F5)" }}
                />
                <div
                  className="absolute top-1/2"
                  style={{ left: progressW, transform: "translate(-50%,-50%) rotate(90deg)", color: "#2BD4F5", filter: "drop-shadow(0 0 5px rgba(45,212,245,.8))" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c.5 0 1 .6 1 1.5V9l8 4.2v1.8l-8-2.3v4.6l2.2 1.6v1.4L12 20.4 8.8 21.9v-1.4L11 18.9v-4.6l-8 2.3v-1.8L11 9V3.5C11 2.6 11.5 2 12 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 22, color: "#eaf2f9", letterSpacing: "0.02em", lineHeight: 1 }}>
                  {route.destination.iata || route.destination.icao || "—"}
                </div>
                <div className="mt-1 max-w-[88px] truncate" style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 9.5, letterSpacing: "0.06em", color: "#6f7e8e" }}>
                  {route.destination.municipality || ""}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* telemetry grid */}
        <div
          className="mx-4 mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-[11px]"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Metric label="ALTITUDE" value={altVal} unit={a.onGround ? "" : altUnit} />
          <Metric label="GROUND SPD" value={spdVal} unit={spdUnit} />
          <Metric label="HEADING" value={a.track != null ? Math.round(a.track) : "—"} unit="°" />
          <Metric label="SQUAWK" value={a.squawk || "—"} unit="" color={sq?.color} />
          <Metric label="VERT RATE" value={vrateVal} unit="fpm" color={vrateColor} />
          <Metric label="DISTANCE" value={distVal} unit={distVal === "—" ? "" : distUnit} />
        </div>

        {/* squawk meaning */}
        {sq && sq.label !== a.squawk && (
          <p className="mx-4 mt-3" style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 10.5, lineHeight: 1.6, color: sq.color }}>
            ⚠ {sq.label} — {sq.description}
          </p>
        )}

        {/* identity rows */}
        <div className="mx-4 mt-3 flex flex-col">
          <IdRow label="ICAO HEX" value={a.hex.toUpperCase()} />
          {a.type && <IdRow label="TYPE CODE" value={a.type} />}
          {a.source && <IdRow label="SOURCE" value={a.source.replace("adsb_", "")} />}
          {a.rssi != null && <IdRow label="SIGNAL" value={`${a.rssi.toFixed(1)} dBFS`} />}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2.5 p-4">
          <button
            onClick={onFollow}
            className="flex items-center justify-center gap-[9px] rounded-[11px] transition hover:brightness-110"
            style={{
              height: 44,
              background: "linear-gradient(180deg,#33d6f5,#16b4d6)",
              color: "#04121a",
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: 12.5,
              letterSpacing: "0.1em",
              boxShadow: "0 0 22px rgba(45,212,245,0.3),inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
            </svg>
            FOLLOW
          </button>
          <a
            href={`https://globe.adsbexchange.com/?icao=${a.hex}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-[11px] text-[#aebccb] transition hover:text-white"
            style={{ height: 38, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em" }}
          >
            VIEW ON ADSBx ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color }: { label: string; value: React.ReactNode; unit: string; color?: string }) {
  return (
    <div style={{ background: "rgba(12,17,24,0.7)", padding: "11px 12px" }}>
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 8.5, letterSpacing: "0.14em", color: "#5d6b7a" }}>{label}</div>
      <div className="mt-[7px] font-mono-tab" style={{ fontWeight: 600, fontSize: 16, color: color ?? "#eaf2f9" }}>
        {value}
        {unit && <span style={{ fontSize: 9, color: "#5d6b7a" }}> {unit}</span>}
      </div>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-[7px]">
      <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 8.5, letterSpacing: "0.14em", color: "#5d6b7a" }}>{label}</span>
      <span className="font-mono-tab text-right" style={{ fontWeight: 500, fontSize: 11.5, color: "#cdd9e6" }}>{value}</span>
    </div>
  );
}
