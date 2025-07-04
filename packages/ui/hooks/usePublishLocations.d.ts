import type { PublishLocation } from "@types";
export interface UsePublishLocationsResult {
    locations: PublishLocation[];
    reload: () => void;
}
export declare function usePublishLocations(): UsePublishLocationsResult;
