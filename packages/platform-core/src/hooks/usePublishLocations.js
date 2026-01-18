"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPublishLocations = loadPublishLocations;
exports.usePublishLocations = usePublishLocations;
const shared_utils_1 = require("@acme/shared-utils");
const react_1 = require("react");
async function loadPublishLocations() {
    try {
        return await (0, shared_utils_1.fetchJson)("/api/publish-locations");
    }
    catch {
        return [];
    }
}
function usePublishLocations() {
    const [locations, setLocations] = (0, react_1.useState)([]);
    const fetchLocations = (0, react_1.useCallback)(async () => {
        setLocations(await loadPublishLocations());
    }, []);
    (0, react_1.useEffect)(() => {
        void fetchLocations();
    }, [fetchLocations]);
    const memoised = (0, react_1.useMemo)(() => locations, [locations]);
    const reload = (0, react_1.useCallback)(() => {
        void fetchLocations();
    }, [fetchLocations]);
    return { locations: memoised, reload };
}
