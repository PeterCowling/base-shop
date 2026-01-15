/* i18n-exempt file -- THEME-0001: Design token CSS values; not user-facing */
// packages/themes/cochlearfit/src/index.ts
//
// Cochlearfit theme - Primary: coral/terracotta (9 75% 59%), Accent: burnt orange (9 62% 48%)
// Warm, earthy, medical device aesthetic with sandy/cream backgrounds

export const tokens = {
  // Brand colors - coral/terracotta primary
  "--color-primary": "9 75% 59%", // coral/terracotta
  "--color-primary-fg": "0 0% 100%",
  "--color-primary-soft": "9 75% 95%",
  "--color-primary-hover": "9 75% 52%",
  "--color-primary-active": "9 75% 45%",
  "--color-accent": "9 62% 48%", // burnt orange
  "--color-accent-fg": "0 0% 100%",
  "--color-accent-soft": "9 62% 95%",

  // Core surfaces - warm sandy/cream tones
  "--color-bg": "42 45% 94%", // sandy cream
  "--color-fg": "33 15% 12%", // warm charcoal

  // Extended palette
  "--color-sand": "38 52% 80%",
  "--color-ocean": "180 32% 46%", // teal/ocean
  "--color-berry": "351 54% 60%",
  "--color-info": "178 51% 29%", // dark teal

  // Surfaces
  "--surface-1": "35 100% 98%",
  "--surface-2": "0 0% 100%",
  "--surface-3": "42 45% 92%",
  "--surface-input": "0 0% 100%",

  // Status colors
  "--color-success": "142 76% 36%",
  "--color-success-fg": "0 0% 100%",
  "--color-warning": "45 93% 47%",
  "--color-warning-fg": "0 0% 10%",
  "--color-danger": "0 72% 51%",
  "--color-danger-fg": "0 0% 100%",

  // Focus ring
  "--ring": "9 75% 59%",
  "--ring-offset": "42 45% 94%",

  // Muted tones
  "--color-muted": "40 30% 90%",
  "--color-fg-muted": "33 11% 33%",

  // Gradient tokens for hero sections
  "--gradient-hero-from": "178 51% 29%", // teal
  "--gradient-hero-via": "42 45% 94%", // sandy
  "--gradient-hero-to": "9 75% 59%", // coral
} as const;
