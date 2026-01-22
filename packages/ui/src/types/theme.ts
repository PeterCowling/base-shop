// src/types/theme.ts
// -----------------------------------------------------------------
// Global theme-related string literal types used throughout the app.
// Feel free to import { Theme } anywhere you need to discriminate
// between colour-schemes.
// -----------------------------------------------------------------

/**
 * User-selectable theme setting.
 * - 'light'   → force light UI
 * - 'dark'    → force dark UI
 * - 'system'  → follow OS preference
 */
export type Theme = "light" | "dark" | "system";
