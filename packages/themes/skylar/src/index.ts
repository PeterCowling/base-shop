/* i18n-exempt file -- THEME-0001: Design token CSS values; not user-facing */
// packages/themes/skylar/src/index.ts
//
// Skylar theme - Multi-locale luxury brand aesthetic
// Primary: vermilion/burnt orange accent, gold accents
// Supports locale-specific variants: en (cream/coral), zh (dark/gold), it (parchment/ink)

export const tokens = {
  // Brand colors - vermilion/burnt orange accent
  "--color-primary": "11.7 85% 48%", // skylar-accent (vermilion)
  "--color-primary-fg": "0 0% 100%",
  "--color-primary-soft": "11.7 85% 95%",
  "--color-primary-hover": "11.7 85% 42%",
  "--color-primary-active": "11.7 85% 36%",
  "--color-accent": "45 69% 63%", // gold
  "--color-accent-fg": "0 0% 10%",
  "--color-accent-soft": "45 69% 95%",

  // Core surfaces - cream/off-white
  "--color-bg": "40 33% 96%", // skylar-cream (#f8f4ed)
  "--color-fg": "0 0% 3%", // near black

  // Extended palette
  "--skylar-gold": "42 53% 62%", // #d5b169
  "--skylar-cream": "40 33% 96%",
  "--skylar-charcoal": "0 0% 3%",

  // EN locale palette
  "--skylar-en-cream": "43 22% 91%", // #EBE9E1
  "--skylar-en-panel": "30 100% 97%", // #fff8f0
  "--skylar-en-accent": "11.7 85% 48%", // #E43D12
  "--skylar-en-secondary": "347 55% 58%", // #D6536D
  "--skylar-en-gold": "42 85% 52%", // #EFB11D
  "--skylar-en-ink": "11 83% 33%", // #9B2C0C

  // IT locale palette
  "--it-ink": "1 68% 35%", // #941F1E
  "--it-secondary": "16 17% 15%", // #2F221E
  "--it-ground": "43 37% 92%", // #F6F0E6
  "--it-gold": "38 52% 65%", // #D8B072
  "--it-sage": "91 15% 38%", // #5F6F52

  // Surfaces
  "--surface-1": "40 33% 99%",
  "--surface-2": "0 0% 100%",
  "--surface-3": "40 33% 94%",
  "--surface-input": "0 0% 100%",

  // Status colors
  "--color-success": "142 76% 36%",
  "--color-success-fg": "0 0% 100%",
  "--color-info": "200 98% 39%",
  "--color-info-fg": "0 0% 100%",
  "--color-warning": "45 93% 47%",
  "--color-warning-fg": "0 0% 10%",
  "--color-danger": "0 72% 51%",
  "--color-danger-fg": "0 0% 100%",

  // Focus ring
  "--ring": "11.7 85% 48%",
  "--ring-offset": "40 33% 96%",
} as const;
