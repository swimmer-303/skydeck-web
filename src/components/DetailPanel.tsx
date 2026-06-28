"use client";

import { useEffect, useState } from "react";
import type { Aircraft, AircraftPhoto, FlightRoute, Settings } from "@/lib/types";
import {
  fmtAltitude,
  fmtHeading,
  fmtSpeed,
  fmtVerticalRate,
  distanceKm,
  fmtDistance,
} from "@/lib/format";
import { altitudeColor, isEmergency, isMilitary } from "@/lib/altitude";
import { decodeSquawk, CATEGORY_LABELS } from "@/lib/squawk";

interface Props {
  aircraft: Aircraft;
  settings: Settings;
  home: { lat: number; lon: number } | null;
  onClose: () => void;
  onFollow: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/5">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-100 text-right tabular-nums">{value}</span>
    </div>
  );
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

  const sq = decodeSquawk(a.squawk);
  const dist =
    home && a.lat != null && a.lon != null
      ? distanceKm(home.lat, home.lon, a.lat, a.lon)
      : null;
  const title = a.flight?.trim() || a.registration || a.hex.toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-950/95 backdrop-blur">
      {/* header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: isEmergency(a) ? "#ef4444" : altitudeColor(a) }}
            />
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <p className="mt-0.5 text-sm text-neutral-400">
            {a.desc || a.type || "Unknown type"}
            {a.operator ? ` · ${a.operator}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {isMilitary(a) && <Badge color="#f59e0b">MILITARY</Badge>}
            {isEmergency(a) && <Badge color="#ef4444">EMERGENCY</Badge>}
            {a.onGround && <Badge color="#9ca3af">ON GROUND</Badge>}
            {a.category && CATEGORY_LABELS[a.category] && (
              <Badge color="#3b82f6">{CATEGORY_LABELS[a.category]}</Badge>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-neutral-500 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {photo && (
        <a href={photo.link ?? undefined} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.large ?? photo.thumbnail} alt={title} className="h-44 w-full object-cover" />
          {photo.photographer && (
            <span className="block px-4 py-1 text-[10px] text-neutral-500">
              © {photo.photographer} / planespotters.net
            </span>
          )}
        </a>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {route && (
          <div className="my-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
            <Airport code={route.origin.iata || route.origin.icao} name={route.origin.municipality} />
            <span className="text-neutral-600">✈</span>
            <Airport code={route.destination.iata || route.destination.icao} name={route.destination.municipality} right />
          </div>
        )}

        <Section title="Position & Motion">
          <Row label="Altitude" value={fmtAltitude(a.altBaro, settings.units, a.onGround)} />
          <Row label="Vertical" value={fmtVerticalRate(a.baroRate)} />
          <Row label="Ground Speed" value={fmtSpeed(a.gs, settings.units)} />
          {a.ias != null && <Row label="Indicated" value={fmtSpeed(a.ias, settings.units)} />}
          {a.mach != null && <Row label="Mach" value={a.mach.toFixed(2)} />}
          <Row label="Track" value={fmtHeading(a.track)} />
          {a.nav_altitude_mcp != null && (
            <Row label="Selected Alt" value={fmtAltitude(a.nav_altitude_mcp, settings.units)} />
          )}
          {dist != null && <Row label="Distance" value={fmtDistance(dist, settings.units)} />}
        </Section>

        <Section title="Identity">
          <Row label="ICAO Hex" value={<span className="font-mono">{a.hex.toUpperCase()}</span>} />
          {a.registration && <Row label="Registration" value={a.registration} />}
          {a.type && <Row label="Type Code" value={a.type} />}
          {a.flight && <Row label="Callsign" value={a.flight.trim()} />}
        </Section>

        <Section title="Transponder">
          <Row
            label="Squawk"
            value={
              sq ? (
                <span style={{ color: sq.color }}>
                  {a.squawk} {sq.label !== a.squawk && `· ${sq.label}`}
                </span>
              ) : (
                "—"
              )
            }
          />
          {sq && sq.label !== a.squawk && (
            <p className="py-2 text-xs leading-relaxed text-neutral-400">{sq.description}</p>
          )}
          {a.rssi != null && <Row label="Signal" value={`${a.rssi.toFixed(1)} dBFS`} />}
          {a.source && <Row label="Source" value={a.source.replace("adsb_", "")} />}
          {a.seen != null && <Row label="Last Msg" value={`${a.seen.toFixed(1)}s`} />}
        </Section>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onFollow}
            className="flex-1 rounded-lg bg-sky-500/90 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400"
          >
            Center & Follow
          </button>
          <a
            href={`https://globe.adsbexchange.com/?icao=${a.hex}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/20"
          >
            ADSBx ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-400/80">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

function Airport({ code, name, right }: { code: string | null; name: string | null; right?: boolean }) {
  return (
    <div className={right ? "text-right" : ""}>
      <div className="text-lg font-bold text-white">{code || "—"}</div>
      <div className="text-xs text-neutral-500">{name || ""}</div>
    </div>
  );
}
