"use client";
// packages/platform-core/hooks/usePublishLocations.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchJson } from "@acme/lib/http";
import type { PublishLocation } from "@acme/types";

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
