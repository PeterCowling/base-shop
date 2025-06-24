import type { PublishLocation } from "@types/PublishLocation";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface UsePublishLocationsResult {
  locations: PublishLocation[];
  reload: () => void;
}

export function usePublishLocations(): UsePublishLocationsResult {
  const [locations, setLocations] = useState<PublishLocation[]>([]);

  const fetchLocations = useCallback(async () => {
    // TODO: replace with real API request
    const data: PublishLocation[] = [
      {
        id: "home-hero",
        name: "Homepage Hero",
        path: "homepage/hero",
        requiredOrientation: "landscape",
      },
      {
        id: "home-featured",
        name: "Homepage Featured Grid",
        path: "homepage/featured",
        requiredOrientation: "portrait",
      },
      {
        id: "prod-upsell",
        name: "Product Page Upsell",
        path: "product/:id/upsell",
        requiredOrientation: "landscape",
      },
    ];
    setLocations(data);
  }, []);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const memoised = useMemo(() => locations, [locations]);

  const reload = useCallback(() => {
    void fetchLocations();
  }, [fetchLocations]);

  return { locations: memoised, reload };
}
