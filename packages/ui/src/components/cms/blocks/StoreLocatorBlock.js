// packages/ui/src/components/cms/blocks/StoreLocatorBlock.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { StoreLocatorMap } from "../../organisms/StoreLocatorMap";
/** CMS wrapper for the StoreLocatorMap organism supporting multiple locations */
export default function StoreLocatorBlock({ locations = [], zoom }) {
    const valid = locations.flatMap((loc) => {
        const lat = typeof loc.lat === "string" ? Number(loc.lat) : loc.lat;
        const lng = typeof loc.lng === "string" ? Number(loc.lng) : loc.lng;
        if (typeof lat === "number" && !isNaN(lat) && typeof lng === "number" && !isNaN(lng)) {
            return [{ lat, lng, label: loc.label }];
        }
        return [];
    });
    if (valid.length === 0)
        return null;
    return _jsx(StoreLocatorMap, { locations: valid, zoom: zoom, heightClass: "h-full" });
}
