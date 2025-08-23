// packages/ui/src/components/cms/blocks/MapBlock.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { StoreLocatorMap } from "../../organisms/StoreLocatorMap";
/** CMS wrapper for the StoreLocatorMap organism */
export default function MapBlock({ lat, lng, zoom }) {
    if (typeof lat !== "number" || typeof lng !== "number")
        return null;
    return (_jsx(StoreLocatorMap, { locations: [{ lat, lng }], zoom: zoom, heightClass: "h-full" }));
}
