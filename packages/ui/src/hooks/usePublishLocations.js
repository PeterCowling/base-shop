"use client";
// packages/ui/hooks/usePublishLocations.ts
import { fetchJson } from "@shared-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
export function usePublishLocations() {
    const [locations, setLocations] = useState([]);
    const fetchLocations = useCallback(async () => {
        try {
            const data = await fetchJson("/api/publish-locations");
            setLocations(data);
        }
        catch {
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
