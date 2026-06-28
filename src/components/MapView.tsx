"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Aircraft, TrailPoint } from "@/lib/types";
import { altitudeColor, isEmergency } from "@/lib/altitude";

interface Props {
  aircraft: Aircraft[];
  selectedHex: string | null;
  showLabels: boolean;
  showTrails: boolean;
  onSelect: (hex: string | null) => void;
  onViewportChange: (lat: number, lon: number, distNm: number) => void;
  getTrail: (hex: string) => TrailPoint[];
  trailVersion: number;
  flyTo: { lat: number; lon: number; zoom?: number } | null;
}

// Light, detailed, Apple-Maps-like basemap — pairs with the porcelain chrome
// and reads far better than the near-black dark-matter style.
const STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// A crisp plane silhouette pointing north (up), drawn to a canvas for use as an
// SDF icon so MapLibre can tint (icon-color) and rotate (icon-rotate) per plane.
function makePlaneImage(): ImageData {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  // Standard "airplane" glyph path (points up = north)
  const p = new Path2D(
    "M12 2 L13 3 L13 10 L22 16 L22 18 L13 15 L13 20 L16 22 L16 23 L12 22 L8 23 L8 22 L11 20 L11 15 L2 18 L2 16 L11 10 L11 3 Z"
  );
  ctx.fillStyle = "#ffffff";
  ctx.fill(p);
  return ctx.getImageData(0, 0, size, size);
}

function fcFromAircraft(aircraft: Aircraft[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: aircraft
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [a.lon!, a.lat!] },
        properties: {
          hex: a.hex,
          track: a.track ?? 0,
          color: isEmergency(a) ? "#ef4444" : altitudeColor(a),
          label: `${a.flight?.trim() || a.registration || a.hex.toUpperCase()}`,
          alt: a.onGround ? "GND" : a.altBaro != null ? `${Math.round(a.altBaro / 100) * 100}` : "",
          ground: a.onGround ? 1 : 0,
        },
      })),
  };
}

// nautical-mile radius covering the current viewport (corner-to-center).
function viewportRadiusNm(map: maplibregl.Map): number {
  const b = map.getBounds();
  const c = b.getCenter();
  const ne = b.getNorthEast();
  const R = 3440.065; // earth radius in nm
  const dLat = ((ne.lat - c.lat) * Math.PI) / 180;
  const dLon = ((ne.lng - c.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c.lat * Math.PI) / 180) ** 2 * Math.sin(dLon / 2) ** 2;
  // Cap at 120 nm: the public feed rate-limits / slows badly on larger radii.
  return Math.min(120, Math.ceil(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

export default function MapView({
  aircraft,
  selectedHex,
  showLabels,
  showTrails,
  onSelect,
  onViewportChange,
  getTrail,
  trailVersion,
  flyTo,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const cbRef = useRef({ onSelect, onViewportChange });
  cbRef.current = { onSelect, onViewportChange };

  // init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-98, 39],
      zoom: 5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({ trackUserLocation: false, showUserLocation: true }),
      "bottom-right"
    );

    map.on("load", () => {
      map.addImage("plane", makePlaneImage(), { sdf: true });

      map.addSource("aircraft", { type: "geojson", data: fcFromAircraft([]) });
      map.addSource("trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource("selected", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-color": "#fbbf24",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "selected-halo",
        type: "circle",
        source: "selected",
        paint: {
          "circle-radius": 18,
          "circle-color": "#2e6ca6",
          "circle-opacity": 0.15,
          "circle-stroke-color": "#2e6ca6",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "planes",
        type: "symbol",
        source: "aircraft",
        layout: {
          "icon-image": "plane",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.45, 8, 0.6, 12, 0.8],
          "icon-rotate": ["get", "track"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-color": ["get", "color"],
          "icon-opacity": ["case", ["==", ["get", "ground"], 1], 0.6, 1],
        },
      });

      map.addLayer({
        id: "plane-labels",
        type: "symbol",
        source: "aircraft",
        minzoom: 7,
        layout: {
          "text-field": ["concat", ["get", "label"], "\n", ["get", "alt"]],
          "text-font": ["Open Sans Bold"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-optional": true,
        },
        paint: {
          "text-color": "#2b2620",
          "text-halo-color": "#faf8f4",
          "text-halo-width": 1.6,
        },
      });

      map.on("click", "planes", (e) => {
        const f = e.features?.[0];
        if (f) cbRef.current.onSelect(f.properties!.hex as string);
      });
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["planes"] });
        if (!hits.length) cbRef.current.onSelect(null);
      });
      map.on("mouseenter", "planes", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "planes", () => (map.getCanvas().style.cursor = ""));

      const report = () => {
        const c = map.getCenter();
        cbRef.current.onViewportChange(c.lat, c.lng, viewportRadiusNm(map));
      };
      report();
      map.on("moveend", report);
      readyRef.current = true;
      // trigger a data sync now that layers exist
      (map.getSource("aircraft") as maplibregl.GeoJSONSource)?.setData(fcFromAircraft([]));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // update aircraft data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource("aircraft") as maplibregl.GeoJSONSource | undefined;
    src?.setData(fcFromAircraft(aircraft));
  }, [aircraft]);

  // selection + trail
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const sel = aircraft.find((a) => a.hex === selectedHex);
    const selSrc = map.getSource("selected") as maplibregl.GeoJSONSource | undefined;
    const trailSrc = map.getSource("trail") as maplibregl.GeoJSONSource | undefined;

    if (sel && sel.lat != null && sel.lon != null) {
      selSrc?.setData({
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [sel.lon, sel.lat] }, properties: {} },
        ],
      });
    } else {
      selSrc?.setData({ type: "FeatureCollection", features: [] });
    }

    if (showTrails && selectedHex) {
      const pts = getTrail(selectedHex);
      trailSrc?.setData({
        type: "FeatureCollection",
        features:
          pts.length > 1
            ? [{ type: "Feature", geometry: { type: "LineString", coordinates: pts.map((p) => [p.lon, p.lat]) }, properties: {} }]
            : [],
      });
    } else {
      trailSrc?.setData({ type: "FeatureCollection", features: [] });
    }
  }, [selectedHex, aircraft, showTrails, getTrail, trailVersion]);

  // labels toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (map.getLayer("plane-labels")) {
      map.setLayoutProperty("plane-labels", "visibility", showLabels ? "visible" : "none");
    }
  }, [showLabels]);

  // external flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    map.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: flyTo.zoom ?? 9, speed: 1.4 });
  }, [flyTo]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
