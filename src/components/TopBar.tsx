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

const TONES: Record<ChipTone, { border: string; bg: string; color: string; dot: string; glow: string }> = {
  accent: {
    border: "rgba(45,212,245,0.5)",
    bg: "rgba(45,212,245,0.16)",
    color: "#bdf1ff",
    dot: "#2BD4F5",
    glow: "0 0 14px rgba(45,212,245,0.18)",
  },
  amber: {
    border: "rgba(245,158,11,0.55)",
    bg: "rgba(245,158,11,0.16)",
    color: "#fde0a3",
    dot: "#f59e0b",
    glow: "0 0 14px rgba(245,158,11,0.2)",
  },
  red: {
    border: "rgba(239,68,68,0.6)",
    bg: "rgba(239,68,68,0.18)",
    color: "#fecaca",
    dot: "#ef4444",
    glow: "0 0 14px rgba(239,68,68,0.2)",
  },
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
      className="inline-flex h-[30px] items-center gap-[7px] rounded-[9px] px-3 font-[600] tracking-[0.07em] transition"
      style={{
        fontSize: 11,
        fontFamily: "var(--font-ui)",
        border: `1px solid ${active ? t.border : "rgba(255,255,255,0.08)"}`,
        background: active ? t.bg : "rgba(255,255,255,0.025)",
        color: active ? t.color : "#93a3b4",
        boxShadow: active ? t.glow : undefined,
        animation: active && pulse ? "skd-emrg 1.4s ease-in-out infinite" : undefined,
      }}
    >
      <span
        className="rounded-[2px]"
        style={{
          width: 6,
          height: 6,
          background: active ? t.dot : "#4b5663",
          boxShadow: active ? `0 0 6px ${t.dot}` : undefined,
        }}
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
  const divider = <div className="h-[30px] w-px bg-white/10" />;

  return (
    <div className="skd-glass pointer-events-auto flex h-14 items-center gap-3.5 rounded-[15px] px-3">
      {/* logo lockup */}
      <div className="flex items-center gap-[11px] pl-0.5 pr-1">
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            border: "1px solid rgba(45,212,245,0.35)",
            boxShadow: "0 0 18px rgba(45,212,245,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skydeck-logo.png" alt="SkyDeck" width={38} height={38} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", color: "#eef4fa", lineHeight: 1 }}>
            Sky<span style={{ color: "#2BD4F5" }}>Deck</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 8, letterSpacing: "0.32em", color: "#5d6b7a", lineHeight: 1 }}>
            FLIGHT&nbsp;TRACKER
          </div>
        </div>
      </div>

      {divider}

      {/* live status + count */}
      <div className="flex items-center gap-[9px]">
        <div
          className={connected ? "skd-live" : ""}
          style={{ width: 9, height: 9, borderRadius: "50%", background: connected ? "#34d399" : "#ef4444" }}
          title={error ?? (connected ? "Live" : "Disconnected")}
        />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono-tab" style={{ fontWeight: 600, fontSize: 16, color: "#eaf2f9", lineHeight: 1 }}>
              {total.toLocaleString()}
            </span>
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 9, letterSpacing: "0.16em", color: "#6f7e8e" }}>
              AIRCRAFT
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 8, letterSpacing: "0.22em", color: connected ? "#34d399" : "#ef4444", lineHeight: 1 }}>
            ● {connected ? "LIVE · ADS-B" : "OFFLINE"}
          </div>
        </div>
      </div>

      <div className="hidden sm:block">{divider}</div>

      {/* toggle chips */}
      <div className="hidden items-center gap-[7px] sm:flex">
        <Chip
          active={settings.showMilitaryOnly}
          tone="amber"
          onClick={() => update({ showMilitaryOnly: !settings.showMilitaryOnly })}
        >
          MIL {militaryCount > 0 && `· ${militaryCount}`}
        </Chip>
        <Chip
          active={settings.showEmergencyOnly}
          tone="red"
          pulse
          onClick={() => update({ showEmergencyOnly: !settings.showEmergencyOnly })}
        >
          EMRG {emergencyCount > 0 && `· ${emergencyCount}`}
        </Chip>
        <Chip active={settings.showLabels} onClick={() => update({ showLabels: !settings.showLabels })}>
          LABELS
        </Chip>
        <Chip active={settings.showTrails} onClick={() => update({ showTrails: !settings.showTrails })}>
          TRAILS
        </Chip>
      </div>

      {divider}

      {/* settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="flex items-center justify-center rounded-[10px] text-[#aebccb] transition hover:text-white"
          style={{ width: 38, height: 38, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
          title="Settings"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        {showSettings && (
          <div
            className="absolute right-0 top-full z-50 mt-2.5 w-[340px] overflow-hidden rounded-[15px]"
            style={{
              background: "linear-gradient(180deg,rgba(15,21,30,0.92),rgba(10,15,22,0.96))",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07),0 24px 60px -12px rgba(0,0,0,0.8)",
            }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
              <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", color: "#aab6c4" }}>
                SETTINGS
              </span>
              <button onClick={() => setShowSettings(false)} className="text-[#6f7e8e] hover:text-white" aria-label="Close">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
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
                  className="w-full rounded-[9px] px-3 py-2 text-xs text-white outline-none"
                  style={{ fontFamily: "var(--font-mono)", background: "rgba(4,8,13,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              )}
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, lineHeight: 1.6, color: "#4b5663" }}>
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
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 9, letterSpacing: "0.14em", color: "#5d6b7a", marginBottom: 9 }}>
        {label}
      </div>
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
    <div className="flex overflow-hidden rounded-[9px]" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={String(o.v)}
            onClick={() => onChange(o.v)}
            className="flex-1 py-2 text-center transition"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 11,
              color: active ? "#04121a" : "#6f7e8e",
              background: active ? "linear-gradient(180deg,#33d6f5,#16b4d6)" : "rgba(255,255,255,0.02)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
