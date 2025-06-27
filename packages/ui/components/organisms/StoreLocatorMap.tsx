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
}

declare global {
  interface Window {
    L?: any;
  }
}

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function StoreLocatorMap({
  locations,
  zoom = 13,
  className,
  ...props
}: StoreLocatorMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;
    let map: any;

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
    <div ref={mapRef} className={cn("h-96 w-full", className)} {...props} />
  );
}
