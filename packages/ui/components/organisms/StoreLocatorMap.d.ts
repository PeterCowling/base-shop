import * as React from "react";
export interface Location {
    lat: number;
    lng: number;
    label?: string;
}
export interface StoreLocatorMapProps extends React.HTMLAttributes<HTMLDivElement> {
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
export declare function StoreLocatorMap({ locations, zoom, heightClass, height, className, ...props }: StoreLocatorMapProps): React.JSX.Element;
export {};
