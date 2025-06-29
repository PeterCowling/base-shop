// packages/ui/hooks/usePublishLocations.ts

import type { PublishLocation } from "@types";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface UsePublishLocationsResult {
  locations: PublishLocation[];
  reload: () => void;
}

export function usePublishLocations(): UsePublishLocationsResult {
  const [locations, setLocations] = useState<PublishLocation[]>([]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/publish-locations");
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = (await res.json()) as PublishLocation[];
      setLocations(data);
    } catch {
      setLocations([]);
    }
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
