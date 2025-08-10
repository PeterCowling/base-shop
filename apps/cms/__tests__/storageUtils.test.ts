// apps/cms/__tests__/storageUtils.test.ts
/* eslint-env jest */

import {
  STORAGE_KEY,
  resetWizardProgress,
} from "../src/app/cms/wizard/hooks/useWizardPersistence";

describe("storageUtils", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({}) })
    );
    localStorage.clear();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("uses a consistent storage key", () => {
    expect(STORAGE_KEY).toBe("cms-wizard-progress");
  });

  it("clears wizard progress from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "data");
    await resetWizardProgress();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "/cms/api/wizard-progress",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
