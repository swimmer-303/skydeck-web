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

type ChipTone = "accent" | "amber" | "red";

const TONES: Record<ChipTone, { fill: string; border: string; dot: string }> = {
  accent: { fill: "#2e6ca6", border: "rgba(46,108,166,0.5)", dot: "#bfe0f5" },
  amber: { fill: "#b07b1c", border: "rgba(176,123,28,0.55)", dot: "#f0d59a" },
  red: { fill: "#c7453b", border: "rgba(199,69,59,0.6)", dot: "#f3bcb6" },
};

function Chip({
  active,
  tone = "accent",
  pulse,
  onClick,
  children,
}: {
  active: boolean;
  tone?: ChipTone;
  pulse?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <button
      onClick={onClick}
      className="inline-flex h-8 items-center gap-2 rounded-[11px] px-[13px] font-[600] transition"
      style={{
        fontSize: 11,
        letterSpacing: "0.03em",
        border: `1px solid ${active ? t.border : "rgba(34,28,22,0.1)"}`,
        background: active ? t.fill : "rgba(34,28,22,0.035)",
        color: active ? "#fff" : "#7c736a",
      }}
    >
      <span
        className={active && pulse ? "skd-live" : ""}
        style={{ width: 6, height: 6, borderRadius: "50%", background: active ? t.dot : "#bdb4a8" }}
      />
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
  const divider = <div className="h-8 w-px" style={{ background: "rgba(34,28,22,0.1)" }} />;

  return (
    <div className="skd-glass pointer-events-auto flex h-[58px] items-center gap-4 rounded-[18px] px-[14px]">
      {/* logo lockup */}
      <div className="flex items-center gap-3 pl-0.5">
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(40,80,120,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skydeck-logo.png" alt="SkyDeck" width={38} height={38} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-[3px]">
          <div style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em", color: "#221e1a", lineHeight: 1 }}>SkyDeck</div>
          <div style={{ fontWeight: 500, fontSize: 9, letterSpacing: "0.18em", color: "#a89e93", lineHeight: 1 }}>FLIGHT TRACKER</div>
        </div>
      </div>

      {divider}

      {/* live status + count */}
      <div className="flex items-center gap-2.5">
        <div
          className={connected ? "skd-live" : ""}
          style={{ width: 9, height: 9, borderRadius: "50%", background: connected ? "#4e9a68" : "#c7453b" }}
          title={error ?? (connected ? "Live" : "Disconnected")}
        />
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-baseline gap-1.5">
            <span className="tnum" style={{ fontWeight: 600, fontSize: 17, color: "#221e1a", lineHeight: 1 }}>
              {total.toLocaleString()}
            </span>
            <span style={{ fontWeight: 500, fontSize: 10, letterSpacing: "0.04em", color: "#8a8178" }}>aircraft</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 9, letterSpacing: "0.1em", color: connected ? "#4e9a68" : "#c7453b", lineHeight: 1 }}>
            {connected ? "LIVE · ADS-B" : "OFFLINE"}
          </div>
        </div>
      </div>

      <div className="hidden sm:block">{divider}</div>

      {/* toggle chips */}
      <div className="hidden items-center gap-2 sm:flex">
        <Chip active={settings.showMilitaryOnly} tone="amber" onClick={() => update({ showMilitaryOnly: !settings.showMilitaryOnly })}>
          MIL {militaryCount > 0 && `· ${militaryCount}`}
        </Chip>
        <Chip active={settings.showEmergencyOnly} tone="red" pulse onClick={() => update({ showEmergencyOnly: !settings.showEmergencyOnly })}>
          EMRG {emergencyCount > 0 && `· ${emergencyCount}`}
        </Chip>
        <Chip active={settings.showLabels} onClick={() => update({ showLabels: !settings.showLabels })}>
          Labels
        </Chip>
        <Chip active={settings.showTrails} onClick={() => update({ showTrails: !settings.showTrails })}>
          Trails
        </Chip>
      </div>

      {divider}

      {/* settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="flex items-center justify-center rounded-[11px] transition"
          style={{ width: 38, height: 38, border: "1px solid rgba(34,28,22,0.1)", background: "rgba(34,28,22,0.035)", color: "#6b6258" }}
          title="Settings"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {showSettings && (
          <div
            className="absolute right-0 top-full z-50 mt-2.5 w-[344px] overflow-hidden rounded-[18px]"
            style={{
              background: "linear-gradient(180deg,rgba(253,251,248,0.97),rgba(248,245,240,0.98))",
              border: "1px solid rgba(34,28,22,0.1)",
              boxShadow: "0 24px 60px -14px rgba(20,15,10,0.5)",
            }}
          >
            <div className="flex items-center justify-between px-[17px] py-[15px]" style={{ borderBottom: "1px solid rgba(34,28,22,0.07)" }}>
              <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", color: "#5a5247" }}>SETTINGS</span>
              <button onClick={() => setShowSettings(false)} className="text-[#9a9085] hover:text-[#5a5247]" aria-label="Close">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 p-[17px]">
              <Field label="REFRESH INTERVAL">
                <Seg
                  options={[
                    { v: 2000, label: "2s" },
                    { v: 5000, label: "5s" },
                    { v: 10000, label: "10s" },
                  ]}
                  value={settings.refreshMs}
                  onChange={(v) => update({ refreshMs: v as number })}
                />
              </Field>
              <Field label="SPEED">
                <Seg
                  options={[
                    { v: "kts", label: "kt" },
                    { v: "mph", label: "mph" },
                    { v: "kmh", label: "km/h" },
                  ]}
                  value={settings.units.speed}
                  onChange={(v) => update({ units: { ...settings.units, speed: v as "kts" } })}
                />
              </Field>
              <Field label="ALTITUDE">
                <Seg
                  options={[
                    { v: "ft", label: "ft" },
                    { v: "m", label: "m" },
                  ]}
                  value={settings.units.altitude}
                  onChange={(v) => update({ units: { ...settings.units, altitude: v as "ft" } })}
                />
              </Field>
              <Field label="DISTANCE">
                <Seg
                  options={[
                    { v: "nm", label: "nm" },
                    { v: "mi", label: "mi" },
                    { v: "km", label: "km" },
                  ]}
                  value={settings.units.distance}
                  onChange={(v) => update({ units: { ...settings.units, distance: v as "nm" } })}
                />
              </Field>
              <Field label="DATA SOURCE">
                <Seg
                  options={[
                    { v: "global", label: "Global" },
                    { v: "custom", label: "Custom" },
                  ]}
                  value={settings.source}
                  onChange={(v) => update({ source: v as "global" })}
                />
              </Field>
              {settings.source === "custom" && (
                <input
                  value={settings.customUrl}
                  onChange={(e) => update({ customUrl: e.target.value })}
                  placeholder="http://pi.local/data/aircraft.json"
                  className="w-full rounded-[11px] px-3 py-2 text-xs text-[#221e1a] outline-none"
                  style={{ background: "rgba(34,28,22,0.025)", border: "1px solid rgba(34,28,22,0.1)" }}
                />
              )}
              <p style={{ fontSize: 9, lineHeight: 1.6, color: "#b3aaa0" }}>
                Global data: adsb.lol · Enrichment: adsbdb, planespotters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 9, letterSpacing: "0.1em", color: "#a89e93", marginBottom: 9 }}>{label}</div>
      {children}
    </div>
  );
}

function Seg<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-[11px]" style={{ border: "1px solid rgba(34,28,22,0.1)" }}>
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={String(o.v)}
            onClick={() => onChange(o.v)}
            className="tnum flex-1 py-[9px] text-center transition"
            style={{
              fontWeight: 600,
              fontSize: 11,
              color: active ? "#fff" : "#7c736a",
              background: active ? "#2e6ca6" : "transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
