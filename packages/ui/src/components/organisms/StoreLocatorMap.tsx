// packages/ui/components/organisms/StoreLocatorMap.tsx
"use client";

import * as React from "react";

import { cn } from "../../utils/style";

/* ────────────────────────────────────────────────────────────────────────────
 * Types reflecting the minimal Leaflet API that we use
 * ────────────────────────────────────────────────────────────────────────── */
export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface StoreLocatorMapProps
  extends React.HTMLAttributes<HTMLDivElement> {
  locations: Location[];
  /** Initial zoom level (default = 13) */
  zoom?: number;
  /** Tailwind height class (preferred) – eg. `h-96` */
  heightClass?: string;
  /** @deprecated  Use `heightClass` instead */
  height?: string;
}

interface LeafletMap {
  setView(coords: [number, number], zoom: number): LeafletMap;
  remove(): void;
}

interface LeafletLayer {
  addTo(map: LeafletMap): this;
}

interface LeafletMarker extends LeafletLayer {
  bindPopup(content: string): LeafletMarker;
}

interface Leaflet {
  map(el: HTMLElement): LeafletMap;
  tileLayer(url: string, options: { attribution: string }): LeafletLayer;
  marker(coords: [number, number]): LeafletMarker;
}

declare global {
  interface Window {
    L?: Leaflet;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Dynamic loader – avoids bundling Leaflet in JS payload
 * ────────────────────────────────────────────────────────────────────────── */
function loadLeaflet(): Promise<Leaflet | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  /* CSS */
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);

  /* JS */
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as { L: Leaflet }).L);
    script.onerror = () => resolve(null); // swallow errors – render nothing
    document.body.appendChild(script);
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────────────────── */
export function StoreLocatorMap({
  locations,
  zoom = 13,
  heightClass = "h-96",
  height, // legacy
  className,
  ...props
}: StoreLocatorMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    /* `map` is assigned only when Leaflet has loaded */
    let map: LeafletMap | null = null;

    loadLeaflet().then((L) => {
      if (!L || !mapRef.current) return;

      /* centre on the first location */
      map = L.map(mapRef.current).setView(
        [locations[0].lat, locations[0].lng],
        zoom
      );

      /* tiles */
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      /* markers */
      locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng])
          .addTo(map!)
          .bindPopup(loc.label ?? "");
      });
    });

    /* cleanup */
    return () => {
      map?.remove();
    };
  }, [locations, zoom]);

  return (
    <div
      ref={mapRef}
      className={cn(height ?? heightClass, "w-full", className)}
      {...props}
    />
  );
}
