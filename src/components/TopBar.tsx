"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  total: number;
  connected: boolean;
  error: string | null;
  emergencyCount: number;
  militaryCount: number;
}

function Toggle({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
        active ? "text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
      }`}
      style={active ? { background: color ?? "#0ea5e9" } : undefined}
    >
      {children}
    </button>
  );
}

export default function TopBar({
  settings,
  update,
  total,
  connected,
  error,
  emergencyCount,
  militaryCount,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-neutral-950/90 px-3 py-2 backdrop-blur ring-1 ring-white/10">
      <div className="flex items-center gap-2 pr-2">
        <span className="text-lg">🛫</span>
        <span className="font-bold tracking-tight text-white">SkyDeck</span>
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`}
          title={error ?? (connected ? "Live" : "Disconnected")}
        />
      </div>

      <div className="hidden items-center gap-2 border-l border-white/10 pl-2 sm:flex">
        <span className="text-sm tabular-nums text-neutral-300">{total}</span>
        <span className="text-xs text-neutral-500">aircraft</span>
      </div>

      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
        <Toggle
          active={settings.showMilitaryOnly}
          onClick={() => update({ showMilitaryOnly: !settings.showMilitaryOnly })}
          color="#f59e0b"
        >
          MIL {militaryCount > 0 && `(${militaryCount})`}
        </Toggle>
        <Toggle
          active={settings.showEmergencyOnly}
          onClick={() => update({ showEmergencyOnly: !settings.showEmergencyOnly })}
          color="#ef4444"
        >
          EMRG {emergencyCount > 0 && `(${emergencyCount})`}
        </Toggle>
        <Toggle active={settings.showLabels} onClick={() => update({ showLabels: !settings.showLabels })}>
          Labels
        </Toggle>
        <Toggle active={settings.showTrails} onClick={() => update({ showTrails: !settings.showTrails })}>
          Trails
        </Toggle>
      </div>

      <div className="relative border-l border-white/10 pl-2">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-white/10"
        >
          ⚙ Settings
        </button>
        {showSettings && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-neutral-950 p-4 text-sm shadow-2xl ring-1 ring-white/10">
            <Field label="Refresh interval">
              <select
                value={settings.refreshMs}
                onChange={(e) => update({ refreshMs: Number(e.target.value) })}
                className="select"
              >
                <option value={2000}>2s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
            </Field>
            <Field label="Speed">
              <Seg
                options={["kts", "mph", "kmh"]}
                value={settings.units.speed}
                onChange={(v) => update({ units: { ...settings.units, speed: v as "kts" } })}
              />
            </Field>
            <Field label="Altitude">
              <Seg
                options={["ft", "m"]}
                value={settings.units.altitude}
                onChange={(v) => update({ units: { ...settings.units, altitude: v as "ft" } })}
              />
            </Field>
            <Field label="Distance">
              <Seg
                options={["mi", "km", "nm"]}
                value={settings.units.distance}
                onChange={(v) => update({ units: { ...settings.units, distance: v as "mi" } })}
              />
            </Field>
            <Field label="Data source">
              <Seg
                options={["global", "custom"]}
                value={settings.source}
                onChange={(v) => update({ source: v as "global" })}
              />
            </Field>
            {settings.source === "custom" && (
              <input
                value={settings.customUrl}
                onChange={(e) => update({ customUrl: e.target.value })}
                placeholder="http://pi.local/data/aircraft.json"
                className="mt-2 w-full rounded bg-white/5 px-2 py-1.5 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-sky-500"
              />
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-neutral-600">
              Global data: adsb.lol · Enrichment: adsbdb, planespotters
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.select) {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 4px 8px;
          color: white;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-400">{label}</span>
      {children}
    </div>
  );
}

function Seg({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded px-2 py-1 text-xs capitalize ${
            value === o ? "bg-sky-500 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
