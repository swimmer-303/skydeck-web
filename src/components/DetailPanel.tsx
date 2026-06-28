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
  const band = emrg ? "#c7453b" : altitudeColor(a);
  const sq = decodeSquawk(a.squawk);
  const title = a.flight?.trim() || a.registration || a.hex.toUpperCase();
  const status = emrg ? "EMERGENCY" : a.onGround ? "ON GROUND" : "EN ROUTE";

  const dist = home && a.lat != null && a.lon != null ? distanceKm(home.lat, home.lon, a.lat, a.lon) : null;

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
  const vrateColor = vrate == null || Math.abs(vrate) < 32 ? "#221e1a" : vrate > 0 ? "#3f7d52" : "#b23a31";
  const vrateVal =
    vrate == null || Math.abs(vrate) < 32 ? "0" : `${vrate > 0 ? "+" : "−"}${Math.abs(Math.round(vrate)).toLocaleString()}`;

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
      className="flex h-full flex-col overflow-hidden rounded-[18px]"
      style={{
        background: "linear-gradient(180deg,rgba(253,251,248,0.97),rgba(248,245,240,0.98))",
        border: "1px solid rgba(34,28,22,0.1)",
        boxShadow: "0 24px 60px -14px rgba(20,15,10,0.5)",
      }}
    >
      {/* photo header */}
      <div
        className="relative flex-none"
        style={{ height: 162, background: photo ? undefined : "repeating-linear-gradient(135deg,#ece7df 0 14px,#f3efe8 14px 28px)" }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.large ?? photo.thumbnail} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        {!photo && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ fontWeight: 500, fontSize: 10, letterSpacing: "0.16em", color: "#b9b0a4" }}>
            AIRCRAFT PHOTO
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(250,248,244,0) 38%,rgba(250,248,244,0.96) 100%)" }} />

        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-[13px] top-[13px] flex items-center justify-center rounded-[9px] text-[#6b6258] backdrop-blur transition hover:text-[#221e1a]"
          style={{ width: 30, height: 30, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(34,28,22,0.1)" }}
          aria-label="Close"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* band + status */}
        <div
          className="absolute left-[15px] top-[14px] flex items-center gap-[7px] rounded-[9px] px-2.5 py-[5px] backdrop-blur"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(34,28,22,0.1)" }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: band }} />
          <span style={{ fontWeight: 600, fontSize: 9, letterSpacing: "0.08em", color: emrg ? "#b23a31" : "#5a5247" }}>{status}</span>
          {mil && <span style={{ fontWeight: 600, fontSize: 8.5, letterSpacing: "0.06em", color: "#9a6a16" }}>· MIL</span>}
        </div>

        {/* callsign overlay */}
        <div className="absolute bottom-[14px] left-[18px] right-[18px]">
          <div className="flex items-end justify-between gap-2.5">
            <div style={{ fontWeight: 600, fontSize: 27, letterSpacing: "-0.01em", color: "#221e1a", lineHeight: 1 }}>{title}</div>
            {a.registration && <div className="tnum" style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: "#8a8178", paddingBottom: 3 }}>{a.registration}</div>}
          </div>
          <div className="mt-[5px] truncate" style={{ fontWeight: 500, fontSize: 11.5, color: "#8a8178" }}>
            {a.desc || a.type || "Unknown type"}
            {a.operator ? ` · ${a.operator}` : ""}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* route */}
        {route && (
          <div className="px-[18px] pb-1 pt-[18px]">
            <div className="flex items-center gap-[13px]">
              <div>
                <div style={{ fontWeight: 600, fontSize: 23, color: "#221e1a", letterSpacing: "0.01em", lineHeight: 1 }}>
                  {route.origin.iata || route.origin.icao || "—"}
                </div>
                <div className="mt-[5px] max-w-[88px] truncate" style={{ fontWeight: 500, fontSize: 10, color: "#8a8178" }}>{route.origin.municipality || ""}</div>
              </div>
              <div className="relative mx-0.5 mb-[17px] h-0.5 flex-1 rounded-[2px]" style={{ background: "rgba(34,28,22,0.1)" }}>
                <div className="absolute left-0 top-0 h-0.5 rounded-[2px]" style={{ width: progressW, background: "#2e6ca6" }} />
                <div className="absolute top-1/2" style={{ left: progressW, transform: "translate(-50%,-50%) rotate(90deg)", color: "#2e6ca6" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c.5 0 1 .6 1 1.5V9l8 4.2v1.8l-8-2.3v4.6l2.2 1.6v1.4L12 20.4 8.8 21.9v-1.4L11 18.9v-4.6l-8 2.3v-1.8L11 9V3.5C11 2.6 11.5 2 12 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontWeight: 600, fontSize: 23, color: "#221e1a", letterSpacing: "0.01em", lineHeight: 1 }}>
                  {route.destination.iata || route.destination.icao || "—"}
                </div>
                <div className="mt-[5px] max-w-[88px] truncate" style={{ fontWeight: 500, fontSize: 10, color: "#8a8178" }}>{route.destination.municipality || ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* telemetry grid */}
        <div
          className="mx-[18px] mt-2.5 grid grid-cols-3 gap-px overflow-hidden rounded-[13px]"
          style={{ background: "rgba(34,28,22,0.07)", border: "1px solid rgba(34,28,22,0.07)" }}
        >
          <Metric label="ALTITUDE" value={altVal} unit={a.onGround ? "" : altUnit} />
          <Metric label="GROUND SPD" value={spdVal} unit={spdUnit} />
          <Metric label="HEADING" value={a.track != null ? Math.round(a.track) : "—"} unit="°" />
          <Metric label="SQUAWK" value={a.squawk || "—"} unit="" color={emrg ? "#b23a31" : undefined} />
          <Metric label="VERT RATE" value={vrateVal} unit="fpm" color={vrateColor} />
          <Metric label="DISTANCE" value={distVal} unit={distVal === "—" ? "" : distUnit} />
        </div>

        {/* squawk meaning */}
        {sq && sq.label !== a.squawk && (
          <p className="mx-[18px] mt-3" style={{ fontWeight: 500, fontSize: 10.5, lineHeight: 1.6, color: emrg ? "#b23a31" : "#8a8178" }}>
            {sq.label} — {sq.description}
          </p>
        )}

        {/* identity rows */}
        <div className="mx-[18px] mt-3 flex flex-col">
          <IdRow label="ICAO HEX" value={a.hex.toUpperCase()} />
          {a.type && <IdRow label="TYPE CODE" value={a.type} />}
          {a.source && <IdRow label="SOURCE" value={a.source.replace("adsb_", "")} />}
          {a.rssi != null && <IdRow label="SIGNAL" value={`${a.rssi.toFixed(1)} dBFS`} />}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2.5 p-[18px]">
          <button
            onClick={onFollow}
            className="flex items-center justify-center gap-[9px] rounded-[13px] text-white transition hover:brightness-105"
            style={{ height: 46, background: "linear-gradient(180deg,#3a78b0,#2c628f)", fontWeight: 600, fontSize: 12.5, letterSpacing: "0.04em", boxShadow: "0 4px 14px -4px rgba(40,80,120,0.5)" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
            </svg>
            Follow this aircraft
          </button>
          <a
            href={`https://globe.adsbexchange.com/?icao=${a.hex}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-[13px] text-[#6b6258] transition hover:text-[#221e1a]"
            style={{ height: 40, background: "rgba(34,28,22,0.035)", border: "1px solid rgba(34,28,22,0.1)", fontWeight: 600, fontSize: 11, letterSpacing: "0.03em" }}
          >
            View on ADSBx ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color }: { label: string; value: React.ReactNode; unit: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.55)", padding: "12px 13px" }}>
      <div style={{ fontWeight: 600, fontSize: 8.5, letterSpacing: "0.1em", color: "#a89e93" }}>{label}</div>
      <div className="tnum mt-2" style={{ fontWeight: 600, fontSize: 17, color: color ?? "#221e1a" }}>
        {value}
        {unit && <span style={{ fontSize: 9, color: "#a89e93", fontWeight: 500 }}> {unit}</span>}
      </div>
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px]" style={{ borderBottom: "1px solid rgba(34,28,22,0.06)" }}>
      <span style={{ fontWeight: 600, fontSize: 8.5, letterSpacing: "0.1em", color: "#a89e93" }}>{label}</span>
      <span className="tnum text-right" style={{ fontWeight: 500, fontSize: 11.5, color: "#3a342d" }}>{value}</span>
    </div>
  );
}
