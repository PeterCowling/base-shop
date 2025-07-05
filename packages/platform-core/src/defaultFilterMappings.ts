// packages/platform-core/defaultFilterMappings.ts

/** Default attribute mappings for catalog filters */
export const defaultFilterMappings = {
  brand: "brand",
  size: "size",
  color: "color",
} as const;

export type DefaultFilterMappings = typeof defaultFilterMappings;
