// apps/cms/src/app/cms/wizard/utils.ts
/* eslint-disable import/consistent-type-specifier-style */

import {
  baseTokens,
  loadThemeTokensBrowser as loadThemeTokens,
  type TokenMap,
} from "@platform-core/themeTokens";
export { baseTokens, loadThemeTokens };
export type { TokenMap };

/* ----------------------------------------------------------
 *  Wizard helper utilities
 * ---------------------------------------------------------- */
export const STORAGE_KEY = "cms-wizard-progress";

export function resetWizardProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
