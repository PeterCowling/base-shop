import type { PageComponent } from "@acme/types";

// Built-in section variants surfaced in the Section Library selector.
// Each entry returns a concrete PageComponent for insertion.
// NOTE: Labels/descriptions must be translated at creation time.
// Use factory functions like getHeaderVariants(t) that accept a translator.
export type BuiltInSection = {
  id: string;
  // Use i18n keys where possible; fallback label/description are supported for legacy entries
  labelKey?: string;
  descriptionKey?: string;
  label?: string;
  description?: string;
  // Always keep this as "/window.svg" so the selector uses our generated preview
  preview: string;
  // Encodes the base type and variant key understood by getPalettePreview
  previewType: string;
  build: () => PageComponent;
};
