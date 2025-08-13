// packages/ui/src/components/cms/blocks/StoreLocatorBlock.tsx
"use client";

import { StoreLocatorMap, type Location } from "../../organisms/StoreLocatorMap";

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
  const valid: Location[] = locations
    .map((loc) => ({
      lat: typeof loc.lat === "string" ? Number(loc.lat) : loc.lat,
      lng: typeof loc.lng === "string" ? Number(loc.lng) : loc.lng,
      label: loc.label,
    }))
    .filter(
      (l): l is Location => typeof l.lat === "number" && !isNaN(l.lat) && typeof l.lng === "number" && !isNaN(l.lng)
    );

  if (valid.length === 0) return null;

  return <StoreLocatorMap locations={valid} zoom={zoom} heightClass="h-full" />;
}
