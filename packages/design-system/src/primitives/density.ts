export type PrimitiveDensity = "comfortable" | "compact";

export function resolveDensityClass({
  density,
  comfortableClass,
  compactClass,
  defaultDensity = "comfortable",
}: {
  density?: PrimitiveDensity;
  comfortableClass: string;
  compactClass: string;
  defaultDensity?: PrimitiveDensity;
}): string {
  const resolvedDensity = density ?? defaultDensity;
  return resolvedDensity === "compact" ? compactClass : comfortableClass;
}
