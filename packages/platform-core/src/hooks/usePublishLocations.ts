// packages/platform-core/hooks/usePublishLocations.ts

import type { PublishLocation } from "@acme/types";
import { fetchJson } from "@acme/shared-utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface UsePublishLocationsResult {
  locations: PublishLocation[];
  reload: () => void;
}

export function usePublishLocations(): UsePublishLocationsResult {
  const [locations, setLocations] = useState<PublishLocation[]>([]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await fetchJson<PublishLocation[]>("/api/publish-locations");
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
