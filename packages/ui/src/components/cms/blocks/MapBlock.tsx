"use client";
import { StoreLocatorMap } from "../../organisms/StoreLocatorMap";

interface Props {
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

export default function MapBlock({
  latitude = 0,
  longitude = 0,
  zoom = 13,
}: Props) {
  return (
    <StoreLocatorMap
      locations={[{ lat: latitude, lng: longitude }]}
      zoom={zoom}
    />
  );
}
