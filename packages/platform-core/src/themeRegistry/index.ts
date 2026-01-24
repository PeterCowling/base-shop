/**
 * Theme Registry for LAUNCH-24: Config-driven theme selection and validation.
 *
 * This module provides:
 * - Auto-discovery of themes from packages/themes/
 * - Theme validation for launch configs
 * - Registry API for CMS theme selection
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

import type { ThemeRegistry, ThemeRegistryEntry } from "@acme/types";
import { themeRegistryEntrySchema, themeRegistrySchema } from "@acme/types";

import { repoRoot } from "../createShop/fsUtils";

/* eslint-disable ds/no-raw-color -- LAUNCH-24 theme defaults are stored as hex values */
/** Default brand colors for built-in themes (extracted from common patterns) */
const DEFAULT_BRAND_COLORS: Record<string, string> = {
  base: "#3B82F6", // Blue
  dark: "#1F2937", // Dark gray
  brandx: "#10B981", // Emerald
  bcd: "#8B5CF6", // Purple
  skylar: "#0EA5E9", // Sky blue
  prime: "#F59E0B", // Amber
  cochlearfit: "#EF4444", // Red
  dummy: "#6B7280", // Gray
};

const DEFAULT_FALLBACK_BRAND_COLOR = "#000000";
/* eslint-enable ds/no-raw-color */

/** Default descriptions for built-in themes */
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  base: "Default theme with light mode and comprehensive token set",
  dark: "Dark mode theme with reduced brightness",
  brandx: "Modern brand-focused theme with bold colors",
  bcd: "Business casual design with purple accents",
  skylar: "Clean sky-blue theme for modern storefronts",
  prime: "Premium amber-accented theme for luxury brands",
  cochlearfit: "Accessible theme optimized for health/wellness",
  dummy: "Placeholder theme for testing",
};

/**
 * Discover themes from packages/themes/ directory.
 * Returns raw theme IDs (directory names).
 */
export function discoverThemes(): string[] {
  const root = repoRoot();
  const themesDir = join(root, "packages", "themes");

  if (!existsSync(themesDir)) {
    return [];
  }

  try {
    const entries = readdirSync(themesDir, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith(".") &&
          existsSync(join(themesDir, e.name, "package.json"))
      )
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Read package.json for a theme to extract metadata.
 */
function readThemePackageJson(
  themeId: string
): { name: string; version: string; description?: string; rapidLaunch?: boolean; rapidLaunchOrder?: number } | null {
  const root = repoRoot();
  const pkgPath = join(root, "packages", "themes", themeId, "package.json");

  if (!existsSync(pkgPath)) {
    return null;
  }

  try {
    const content = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content) as {
      name?: string;
      version?: string;
      description?: string;
      rapidLaunch?: boolean;
      rapidLaunchOrder?: number;
      acmeTheme?: {
        rapidLaunch?: boolean;
        rapidLaunchOrder?: number;
      };
    };
    const rapidLaunch = pkg.acmeTheme?.rapidLaunch ?? pkg.rapidLaunch;
    const rapidLaunchOrder = pkg.acmeTheme?.rapidLaunchOrder ?? pkg.rapidLaunchOrder;
    return {
      name: pkg.name ?? `@themes/${themeId}`,
      version: pkg.version ?? "0.0.0",
      description: pkg.description,
      rapidLaunch,
      rapidLaunchOrder,
    };
  } catch {
    return null;
  }
}

function hasTokensCss(themeId: string): boolean {
  const root = repoRoot();
  const tokensPath = join(root, "packages", "themes", themeId, "tokens.css");
  return existsSync(tokensPath);
}

/**
 * Build a ThemeRegistryEntry from a theme ID.
 */
export function buildThemeEntry(themeId: string): ThemeRegistryEntry {
  const pkgInfo = readThemePackageJson(themeId);
  const displayName = themeId.charAt(0).toUpperCase() + themeId.slice(1);

  const entry: ThemeRegistryEntry = {
    id: themeId,
    name: displayName,
    description:
      pkgInfo?.description ?? DEFAULT_DESCRIPTIONS[themeId] ?? undefined,
    packageName: pkgInfo?.name ?? `@themes/${themeId}`,
    version: pkgInfo?.version ?? "0.0.0",
    brandColor: DEFAULT_BRAND_COLORS[themeId] ?? DEFAULT_FALLBACK_BRAND_COLOR,
    tags: [],
    available: hasTokensCss(themeId),
    tier: "basic",
    createdAt: new Date().toISOString(),
    rapidLaunch: pkgInfo?.rapidLaunch,
    rapidLaunchOrder: pkgInfo?.rapidLaunchOrder,
  };

  // Apply default tags based on theme name
  if (themeId === "base") {
    entry.tags = ["default", "light"];
  } else if (themeId === "dark") {
    entry.tags = ["dark"];
  } else if (themeId === "dummy") {
    entry.available = false;
    entry.tags = ["test"];
  }

  return themeRegistryEntrySchema.parse(entry);
}

/**
 * Build the complete theme registry by discovering all themes.
 */
export function buildThemeRegistry(): ThemeRegistry {
  const themeIds = discoverThemes();
  const themes = themeIds.map(buildThemeEntry);

  return themeRegistrySchema.parse({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    themes,
  });
}

/**
 * Get list of available theme IDs (for validation).
 */
export function getAvailableThemeIds(): string[] {
  const registry = buildThemeRegistry();
  return registry.themes.filter((t) => t.available).map((t) => t.id);
}

/**
 * Validate that a theme ID exists in the registry.
 */
export function isValidTheme(themeId: string): boolean {
  const available = getAvailableThemeIds();
  return available.includes(themeId);
}

/**
 * Get a theme entry by ID.
 */
export function getThemeEntry(themeId: string): ThemeRegistryEntry | null {
  const registry = buildThemeRegistry();
  return registry.themes.find((t) => t.id === themeId) ?? null;
}

function sortRapidLaunchThemes(entries: ThemeRegistryEntry[]): ThemeRegistryEntry[] {
  return [...entries].sort((a, b) => {
    const orderA = a.rapidLaunchOrder ?? Number.POSITIVE_INFINITY;
    const orderB = b.rapidLaunchOrder ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    const createdA = a.createdAt ?? "";
    const createdB = b.createdAt ?? "";
    if (createdA !== createdB) return createdA.localeCompare(createdB);
    return a.id.localeCompare(b.id);
  });
}

export function getRapidLaunchThemes(): ThemeRegistryEntry[] {
  const registry = buildThemeRegistry();
  const available = registry.themes.filter((t) => t.available);
  const rapid = available.filter((t) => t.rapidLaunch);
  if (rapid.length > 0) {
    return sortRapidLaunchThemes(rapid);
  }
  if (available.length > 0) {
    // i18n-exempt -- DS-1234 [ttl=2026-12-31] — developer warning only
    console.warn("[rapid-launch] No themes tagged; falling back to first available theme.");
  }
  return sortRapidLaunchThemes(available);
}

export function pickRapidLaunchTheme(): ThemeRegistryEntry | null {
  return getRapidLaunchThemes()[0] ?? null;
}

/**
 * Validation result for theme selection.
 */
export interface ThemeValidationResult {
  valid: boolean;
  themeId: string;
  error?: string;
  suggestion?: string[];
}

/**
 * Validate a theme selection with detailed error messages.
 */
export function validateThemeSelection(themeId: string): ThemeValidationResult {
  const available = getAvailableThemeIds();

  if (!themeId) {
    return {
      valid: false,
      themeId,
      error: "Theme ID is required",
      suggestion: available.slice(0, 5),
    };
  }

  if (available.includes(themeId)) {
    return { valid: true, themeId };
  }

  // Check if theme exists but is not available
  const registry = buildThemeRegistry();
  const entry = registry.themes.find((t) => t.id === themeId);
  if (entry && !entry.available) {
    return {
      valid: false,
      themeId,
      error: `Theme "${themeId}" exists but is not available for new shops`,
      suggestion: available.slice(0, 5),
    };
  }

  // Theme doesn't exist
  return {
    valid: false,
    themeId,
    error: `Theme "${themeId}" not found in registry`,
    suggestion: available.slice(0, 5),
  };
}

// Re-export types
export type { ThemeRegistry, ThemeRegistryEntry };
