import { STORAGE_KEY, resetWizardProgress } from "../src/app/cms/wizard/storageUtils";

describe("storageUtils", () => {
  it("removes wizard progress from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "test");
    resetWizardProgress();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
