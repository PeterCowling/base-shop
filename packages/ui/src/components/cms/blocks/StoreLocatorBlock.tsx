// packages/ui/src/components/cms/blocks/StoreLocatorBlock.tsx
"use client";

import { type Location,StoreLocatorMap } from "../../organisms/StoreLocatorMap";

interface LocationInput {
  lat?: number | string;
  lng?: number | string;
  label?: string;
}

interface Props {
  /** Locations to display on the map */
  locations?: LocationInput[];
  /** Initial zoom level */
  zoom?: number;
}

/** CMS wrapper for the StoreLocatorMap organism supporting multiple locations */
export default function StoreLocatorBlock({ locations = [], zoom }: Props) {
  const valid: Location[] = locations.flatMap((loc) => {
    const lat = typeof loc.lat === "string" ? Number(loc.lat) : loc.lat;
    const lng = typeof loc.lng === "string" ? Number(loc.lng) : loc.lng;
    if (typeof lat === "number" && !isNaN(lat) && typeof lng === "number" && !isNaN(lng)) {
      return [{ lat, lng, label: loc.label }];
    }
    return [];
  });

  if (valid.length === 0) return null;

  return <StoreLocatorMap locations={valid} zoom={zoom} heightClass="h-full" />;
}
