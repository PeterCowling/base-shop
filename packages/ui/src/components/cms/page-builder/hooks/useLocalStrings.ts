"use client";

/**
 * Lightweight local strings helper for PageBuilder-only UI overlays.
 * Replace with app-wide i18n when available.
 */
export default function useLocalStrings(locale?: string | null) {
  const L = locale || "en";
  // i18n-exempt: Local dictionary for PageBuilder-only overlay strings.
  /* eslint-disable ds/no-hardcoded-copy -- AGENTS-0001: Localized copy entries live here by design */
  const dict: Record<string, Record<string, string>> = {
    en: {
      cannotPlace: "Cannot place ${type} here",
      cannotMove: "Cannot move ${type} here",
      movedToTab: "Moved to tab ${n}",
      canceled: "Canceled",
      source_palette: "Palette",
      source_library: "Library",
      source_canvas: "Canvas",
      prompt_make_global: "Name this Global component:",
      msg_made_global: "Made Global: ${label}",
      warn_not_global: "This block is not linked to a Global component yet. Use 'Make Global' first.",
      confirm_apply_global: "Apply current block state to the Global template and update all instances on this page?",
      msg_updated_global: "Updated Global and instances",
      msg_inserted_global: "Inserted Global: ${label}",
      cannot_add_at_root: "Cannot add ${type} at page root",
      image_inserted: "Image inserted",
      prompt_save_to_library: "Save to My Library as:",
      prompt_add_tags: "Add tags (comma-separated)",
      default_blocks_label: "${n} blocks",
      tour_palette: "Drag components from the palette onto the canvas.",
      tour_toolbar: "Use the toolbar to change device, locale, and more.",
      tour_canvas: "Arrange and edit components on the canvas.",
      tour_sidebar: "Edit the selected component's settings in this sidebar.",
      notify_save_failed: "Save failed",
      notify_changes_saved: "Changes saved",
      notify_published: "Page published",
      notify_publish_failed: "Publish failed",
    },
  };
  /* eslint-enable ds/no-hardcoded-copy */

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
