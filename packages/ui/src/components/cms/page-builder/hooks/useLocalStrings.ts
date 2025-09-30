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

      // Layout: PositionControls
      position_property_hint: "CSS position property",
      position_label: "Position",
      dock_x_hint: "Dock horizontally to container",
      dock_x_label: "Dock X",
      dock_left: "Dock Left",
      dock_center: "Dock Center",
      dock_right: "Dock Right",
      dock_y_hint: "Dock vertically to container",
      dock_y_label: "Dock Y",
      dock_top: "Dock Top",
      dock_bottom: "Dock Bottom",
      offset_top_label: "Top",
      offset_top_hint: "CSS top offset (px/%/rem)",
      offset_placeholder: "e.g. 10px",
      offset_left_label: "Left",
      offset_left_hint: "CSS left offset (px/%/rem)",
      offset_right_label: "Right",
      offset_right_hint: "CSS right offset (px/%/rem)",
      offset_bottom_label: "Bottom",
      offset_bottom_hint: "CSS bottom offset (px/%/rem)",
      pin_left: "Pin Left",
      pin_right: "Pin Right",
      pin_top: "Pin Top",
      pin_bottom: "Pin Bottom",
      stretch_x: "Stretch X",
      stretch_y: "Stretch Y",
      aria_stretch_horizontally: "Stretch horizontally",
      aria_stretch_vertically: "Stretch vertically",

      // Layout: SizeControls
      tooltip_width_hint: "CSS width with unit (px/%/rem)",
      tooltip_height_hint: "CSS height with unit (px/%/rem)",
      placeholder_width: "e.g. 100px or 50%",
      placeholder_height: "e.g. 1px or 1rem",
      label_override_active: "Override active",
      label_reset: "Reset",
      label_full_width: "Full width",
      label_full_height: "Full height",
      aria_explain_width_units: "Explain width units",
      aria_explain_height_units: "Explain height units",
      width_label_template: "Width (${vp})",
      height_label_template: "Height (${vp})",
      device_desktop: "Desktop",
      device_tablet: "Tablet",
      device_mobile: "Mobile",
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
