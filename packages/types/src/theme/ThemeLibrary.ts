import { z } from "zod";

// eslint-disable-next-line ds/no-raw-color -- LAUNCH-24 default theme preview color must be a hex value
const DEFAULT_BRAND_COLOR = "#000000";

// LAUNCH-24: Enhanced theme registry entry with metadata for config-driven selection
export const themeRegistryEntrySchema = z
  .object({
    /** Unique identifier matching packages/themes/{id} directory */
    id: z.string().min(1),
    /** Human-readable display name */
    name: z.string().min(1),
    /** Brief description of the theme */
    description: z.string().optional(),
    /** Package name in workspace (e.g., "@themes/base") */
    packageName: z.string().min(1),
    /** Semver version from package.json */
    version: z.string().default("0.0.0"),
    /** Primary brand color (hex) for UI preview */
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default(DEFAULT_BRAND_COLOR),
    /** Tags for filtering/categorization */
    tags: z.array(z.string()).default([]),
    /** URL to preview image (optional) */
    previewUrl: z.string().url().optional(),
    /** Whether this theme is available for new shops */
    available: z.boolean().default(true),
    /** Theme tier (which shop tiers can use it) */
    tier: z.enum(["basic", "standard", "enterprise"]).default("basic"),
    /** When the theme was added to registry */
    createdAt: z.string().optional(),
    /** Who added the theme */
    createdBy: z.string().optional(),
  })
  .strict();

export type ThemeRegistryEntry = z.infer<typeof themeRegistryEntrySchema>;

// LAUNCH-24: Theme registry (collection of entries)
export const themeRegistrySchema = z.object({
  /** Schema version for future migrations */
  schemaVersion: z.number().int().min(1).default(1),
  /** When the registry was last updated */
  updatedAt: z.string(),
  /** All available themes */
  themes: z.array(themeRegistryEntrySchema),
});

export type ThemeRegistry = z.infer<typeof themeRegistrySchema>;

// Legacy: Keep existing schema for backwards compatibility with CMS theme library
export const themeLibrarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brandColor: z.string(),
    createdBy: z.string(),
    version: z.number().default(1),
    themeDefaults: z.record(z.string()).default({}),
    themeOverrides: z.record(z.string()).default({}),
    themeTokens: z.record(z.string()).default({}),
  })
  .strict();

export type ThemeLibraryEntry = z.infer<typeof themeLibrarySchema>;
