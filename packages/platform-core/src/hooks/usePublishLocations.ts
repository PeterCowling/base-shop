"use client";
// packages/platform-core/hooks/usePublishLocations.ts

import type { PublishLocation } from "@acme/types";
import { fetchJson } from "@acme/shared-utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface UsePublishLocationsResult {
  locations: PublishLocation[];
  reload: () => void;
}

export async function loadPublishLocations(): Promise<PublishLocation[]> {
  try {
    return await fetchJson<PublishLocation[]>("/api/publish-locations");
  } catch {
    return [];
  }
}

export function usePublishLocations(): UsePublishLocationsResult {
  const [locations, setLocations] = useState<PublishLocation[]>([]);

  const fetchLocations = useCallback(async () => {
    setLocations(await loadPublishLocations());
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
