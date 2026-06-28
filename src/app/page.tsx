"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useAircraft, type Viewport } from "@/hooks/useAircraft";
import { isEmergency, isMilitary } from "@/lib/altitude";
import Sidebar from "@/components/Sidebar";
import DetailPanel from "@/components/DetailPanel";
import TopBar from "@/components/TopBar";
import Legend from "@/components/Legend";

// MapLibre touches window/document — load client-only.
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  const { settings, update, loaded } = useSettings();
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const homeRef = useRef<{ lat: number; lon: number } | null>(null);

  const feed = useAircraft(viewport, settings);

  const home = useMemo(
    () => (viewport ? { lat: viewport.lat, lon: viewport.lon } : homeRef.current),
    [viewport]
  );

  const onViewportChange = useCallback((lat: number, lon: number, distNm: number) => {
    homeRef.current = { lat, lon };
    setViewport({ lat, lon, distNm });
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    return feed.aircraft.filter((a) => {
      if (settings.showMilitaryOnly && !isMilitary(a)) return false;
      if (settings.showEmergencyOnly && !isEmergency(a)) return false;
      const alt = a.altBaro ?? 0;
      if (!a.onGround && (alt < settings.altitudeFilter[0] || alt > settings.altitudeFilter[1]))
        return false;
      return true;
    });
  }, [feed.aircraft, settings.showMilitaryOnly, settings.showEmergencyOnly, settings.altitudeFilter]);

  const selected = useMemo(
    () => feed.byHex.get(selectedHex ?? "") ?? null,
    [feed.byHex, selectedHex]
  );

  const emergencyCount = useMemo(() => feed.aircraft.filter(isEmergency).length, [feed.aircraft]);
  const militaryCount = useMemo(() => feed.aircraft.filter(isMilitary).length, [feed.aircraft]);

  // Global search → fly to the result
  const handleSearch = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const a = data.aircraft?.[0];
      if (a?.lat != null && a?.lon != null) {
        setFlyTo({ lat: a.lat, lon: a.lon, zoom: 10 });
        setSelectedHex(a.hex);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const followSelected = useCallback(() => {
    if (selected?.lat != null && selected?.lon != null) {
      setFlyTo({ lat: selected.lat, lon: selected.lon, zoom: 10 });
    }
  }, [selected]);

  if (!loaded) return <div className="h-dvh w-full bg-[#0a0806]" />;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0a0806] text-[#221e1a]">
      <MapView
        aircraft={filtered}
        selectedHex={selectedHex}
        showLabels={settings.showLabels}
        showTrails={settings.showTrails}
        onSelect={setSelectedHex}
        onViewportChange={onViewportChange}
        getTrail={feed.getTrail}
        trailVersion={feed.trailVersion}
        flyTo={flyTo}
      />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start gap-2 p-[24px]">
        <div className="pointer-events-auto">
          <TopBar
            settings={settings}
            update={update}
            total={feed.aircraft.length}
            connected={feed.connected}
            error={feed.error}
            emergencyCount={emergencyCount}
            militaryCount={militaryCount}
          />
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="absolute left-[24px] top-[102px] z-10 hidden w-[332px] sm:block">
          <Sidebar
            aircraft={filtered}
            selectedHex={selectedHex}
            settings={settings}
            home={home}
            onSelect={setSelectedHex}
            onSearch={handleSearch}
            onToggle={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Reopen list button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="skd-glass absolute left-[24px] top-[102px] z-10 hidden h-[44px] w-[44px] items-center justify-center rounded-[14px] text-[#6b6258] hover:text-[#221e1a] sm:flex"
          title="Show list"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="absolute right-[24px] top-[24px] z-30 h-[calc(100dvh-3rem)] w-[366px] max-w-[calc(100vw-1.5rem)]">
          <DetailPanel
            aircraft={selected}
            settings={settings}
            home={home}
            onClose={() => setSelectedHex(null)}
            onFollow={followSelected}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10">
        <Legend />
      </div>
    </main>
  );
}
