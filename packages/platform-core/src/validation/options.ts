export type ParentKind = "ROOT" | string;

export type PlacementOptions = { parent: ParentKind; sectionsOnly?: boolean };

export function resolveSectionsOnlyFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY === "true";
}

export function rootPlacementOptions(overrides?: Partial<PlacementOptions>): PlacementOptions {
  return {
    parent: "ROOT",
    sectionsOnly: overrides?.sectionsOnly ?? resolveSectionsOnlyFromEnv(),
  } as PlacementOptions;
}

export function withDefaults(options: PlacementOptions): PlacementOptions {
  const sectionsOnly =
    typeof options.sectionsOnly === "boolean" ? options.sectionsOnly : resolveSectionsOnlyFromEnv();
  return { ...options, sectionsOnly };
}

