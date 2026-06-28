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

  if (!loaded) return <div className="h-dvh w-full bg-neutral-950" />;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-neutral-950 text-neutral-100">
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="rounded-xl bg-neutral-950/90 px-3 py-2.5 text-sm backdrop-blur ring-1 ring-white/10 hover:bg-neutral-900"
            title="Toggle list"
          >
            ☰
          </button>
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
        <div className="absolute left-3 top-20 z-10 hidden h-[calc(100dvh-6rem)] w-80 overflow-hidden rounded-xl ring-1 ring-white/10 sm:block">
          <Sidebar
            aircraft={filtered}
            selectedHex={selectedHex}
            settings={settings}
            home={home}
            onSelect={setSelectedHex}
            onSearch={handleSearch}
          />
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="absolute right-3 top-20 z-30 h-[calc(100dvh-6rem)] w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl ring-1 ring-white/10">
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
