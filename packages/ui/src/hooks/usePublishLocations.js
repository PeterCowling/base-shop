// packages/ui/hooks/usePublishLocations.ts
import { useCallback, useEffect, useMemo, useState } from "react";
export function usePublishLocations() {
    const [locations, setLocations] = useState([]);
    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch("/api/publish-locations");
            if (!res.ok)
                throw new Error("Failed to fetch locations");
            const data = (await res.json());
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
