/**
 * Tests for LAUNCH-24: Theme Registry and Validation
 * @jest-environment node
 */

import * as path from "path";

import {
  buildThemeEntry,
  buildThemeRegistry,
  discoverThemes,
  getAvailableThemeIds,
  getThemeEntry,
  isValidTheme,
  validateThemeSelection,
} from "../src/themeRegistry";

// Mock repoRoot to return consistent path for tests
jest.mock("../src/createShop/fsUtils", () => {
  const actual = jest.requireActual("../src/createShop/fsUtils");
  return {
    ...actual,
    repoRoot: () => path.resolve(__dirname, "../../.."),
  };
});

describe("Theme Registry (LAUNCH-24)", () => {
  describe("discoverThemes", () => {
    it("discovers themes from packages/themes directory", () => {
      const themes = discoverThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain("base");
    });

    it("returns theme directory names", () => {
      const themes = discoverThemes();

      // All should be lowercase directory names
      for (const theme of themes) {
        expect(theme).toMatch(/^[a-z0-9-]+$/);
      }
    });
  });

  describe("buildThemeEntry", () => {
    it("builds entry for base theme", () => {
      const entry = buildThemeEntry("base");

      expect(entry.id).toBe("base");
      expect(entry.name).toBe("Base");
      expect(entry.packageName).toBe("@themes/base");
      expect(entry.available).toBe(true);
      expect(entry.tier).toBe("basic");
      expect(entry.tags).toContain("default");
    });

    it("builds entry for dark theme", () => {
      const entry = buildThemeEntry("dark");

      expect(entry.id).toBe("dark");
      expect(entry.tags).toContain("dark");
    });

    it("builds entry for incomplete theme with defaults", () => {
      // dummy theme is a test fixture and should remain unavailable
      const entry = buildThemeEntry("dummy");

      expect(entry.id).toBe("dummy");
      expect(entry.packageName).toBe("@themes/dummy");
      expect(entry.available).toBe(false); // marked unavailable because it's a test theme
      expect(entry.tags).toContain("test");
    });

    it("includes brandColor as valid hex", () => {
      const entry = buildThemeEntry("base");

      expect(entry.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("buildThemeRegistry", () => {
    it("builds registry with all discovered themes", () => {
      const registry = buildThemeRegistry();

      expect(registry.schemaVersion).toBe(1);
      expect(registry.updatedAt).toBeDefined();
      expect(Array.isArray(registry.themes)).toBe(true);
      expect(registry.themes.length).toBeGreaterThan(0);
    });

    it("includes base theme in registry", () => {
      const registry = buildThemeRegistry();
      const base = registry.themes.find((t) => t.id === "base");

      expect(base).toBeDefined();
      expect(base?.available).toBe(true);
    });
  });

  describe("getAvailableThemeIds", () => {
    it("returns only available theme IDs", () => {
      const available = getAvailableThemeIds();

      expect(available).toContain("base");
      expect(available).toContain("dark");
      // dummy should be excluded (not available)
      expect(available).not.toContain("dummy");
    });
  });

  describe("isValidTheme", () => {
    it("returns true for valid theme", () => {
      expect(isValidTheme("base")).toBe(true);
      expect(isValidTheme("dark")).toBe(true);
    });

    it("returns false for invalid theme", () => {
      expect(isValidTheme("nonexistent")).toBe(false);
      expect(isValidTheme("")).toBe(false);
    });

    it("returns false for unavailable theme (dummy)", () => {
      // dummy theme exists in registry but is marked available: false
      expect(isValidTheme("dummy")).toBe(false);
    });
  });

  describe("getThemeEntry", () => {
    it("returns entry for existing theme", () => {
      const entry = getThemeEntry("base");

      expect(entry).not.toBeNull();
      expect(entry?.id).toBe("base");
    });

    it("returns null for nonexistent theme", () => {
      const entry = getThemeEntry("nonexistent");

      expect(entry).toBeNull();
    });
  });

  describe("validateThemeSelection", () => {
    it("returns valid result for available theme", () => {
      const result = validateThemeSelection("base");

      expect(result.valid).toBe(true);
      expect(result.themeId).toBe("base");
      expect(result.error).toBeUndefined();
    });

    it("returns error for nonexistent theme", () => {
      const result = validateThemeSelection("nonexistent");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not found");
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion?.length).toBeGreaterThan(0);
    });

    it("returns error for empty theme ID", () => {
      const result = validateThemeSelection("");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("returns error for unavailable theme", () => {
      const result = validateThemeSelection("dummy");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("provides suggestions on error", () => {
      const result = validateThemeSelection("unknown");

      expect(result.suggestion).toContain("base");
    });
  });
});
