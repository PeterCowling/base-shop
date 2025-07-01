import * as React from "react";
import { cn } from "../../utils/cn";

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface StoreLocatorMapProps
  extends React.HTMLAttributes<HTMLDivElement> {
  locations: Location[];
  zoom?: number;
  /** Tailwind height class */
  heightClass?: string;
  /** @deprecated Use `heightClass` instead */
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

function loadLeaflet(): Promise<Leaflet | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as { L: Leaflet }).L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function StoreLocatorMap({
  locations,
  zoom = 13,
  heightClass = "h-96",
  height,
  className,
  ...props
}: StoreLocatorMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;
    let map: LeafletMap | null = null;

    loadLeaflet().then((L) => {
      if (!mapRef.current) return;
      map = L.map(mapRef.current).setView(
        [locations[0].lat, locations[0].lng],
        zoom
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng])
          .addTo(map)
          .bindPopup(loc.label ?? "");
      });
    });

    return () => {
      if (map) {
        map.remove();
      }
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
