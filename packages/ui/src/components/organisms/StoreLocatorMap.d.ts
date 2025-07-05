import * as React from "react";
export interface Location {
    lat: number;
    lng: number;
    label?: string;
}
export interface StoreLocatorMapProps extends React.HTMLAttributes<HTMLDivElement> {
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
    tileLayer(url: string, options: {
        attribution: string;
    }): LeafletLayer;
    marker(coords: [number, number]): LeafletMarker;
}
declare global {
    interface Window {
        L?: Leaflet;
    }
}
export declare function StoreLocatorMap({ locations, zoom, heightClass, height, // legacy
className, ...props }: StoreLocatorMapProps): import("react/jsx-runtime").JSX.Element;
export {};
