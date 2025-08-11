// packages/ui/src/components/cms/blocks/MapBlock.tsx
"use client";

import { StoreLocatorMap } from "../../organisms/StoreLocatorMap";

interface Props {
  /** Latitude for the map centre */
  lat?: number;
  /** Longitude for the map centre */
  lng?: number;
  /** Initial zoom level */
  zoom?: number;
}

/** CMS wrapper for the StoreLocatorMap organism */
export default function MapBlock({ lat, lng, zoom }: Props) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return (
    <StoreLocatorMap
      locations={[{ lat, lng }]}
      zoom={zoom}
      heightClass="h-full"
    />
  );
}
