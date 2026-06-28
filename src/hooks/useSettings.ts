"use client";

import { useCallback, useEffect, useState } from "react";
import type { Settings } from "@/lib/types";

const DEFAULTS: Settings = {
  refreshMs: 3000,
  units: { speed: "kts", altitude: "ft", distance: "mi" },
  showMilitaryOnly: false,
  showEmergencyOnly: false,
  showLabels: true,
  showTrails: true,
  altitudeFilter: [0, 60000],
  source: "global",
  customUrl: "",
};

const KEY = "skydeck.settings.v1";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    []
  );

  return { settings, update, loaded };
}
