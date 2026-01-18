export type ParentKind = "ROOT" | string;
export type PlacementOptions = {
    parent: ParentKind;
    sectionsOnly?: boolean;
};
export declare function resolveSectionsOnlyFromEnv(): boolean;
export declare function rootPlacementOptions(overrides?: Partial<PlacementOptions>): PlacementOptions;
export declare function withDefaults(options: PlacementOptions): PlacementOptions;
