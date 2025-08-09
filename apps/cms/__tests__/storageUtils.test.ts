// apps/cms/__tests__/storageUtils.test.ts
/* eslint-env jest */

import { STORAGE_KEY, resetWizardProgress } from "../src/app/cms/wizard/storageUtils";

describe("storageUtils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses a consistent storage key", () => {
    expect(STORAGE_KEY).toBe("cms-wizard-progress");
  });

  it("clears wizard progress from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "data");
    resetWizardProgress();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
