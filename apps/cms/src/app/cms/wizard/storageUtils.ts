// apps/cms/src/app/cms/wizard/storageUtils.ts

export const STORAGE_KEY = "cms-wizard-progress";

export function resetWizardProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
