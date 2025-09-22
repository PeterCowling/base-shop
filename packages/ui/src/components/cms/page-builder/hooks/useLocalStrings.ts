"use client";

/**
 * Lightweight local strings helper for PageBuilder-only UI overlays.
 * Replace with app-wide i18n when available.
 */
export default function useLocalStrings(locale?: string | null) {
  const L = locale || "en";
  const dict: Record<string, Record<string, string>> = {
    en: {
      cannotPlace: "Cannot place ${type} here",
      cannotMove: "Cannot move ${type} here",
      movedToTab: "Moved to tab ${n}",
      canceled: "Canceled",
      source_palette: "Palette",
      source_library: "Library",
      source_canvas: "Canvas",
    },
  };

  const table = dict[L] || dict.en;

  return function t(key: string, vars?: Record<string, unknown>) {
    const raw = table[key] || key;
    try {
      // simple template token replacement: ${var}
      return raw.replace(/\$\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? ""));
    } catch {
      return raw;
    }
  };
}

