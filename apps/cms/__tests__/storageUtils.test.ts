// apps/cms/__tests__/storageUtils.test.ts
/* eslint-env jest */

import {
  resetConfiguratorProgress,
  STORAGE_KEY,
} from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

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
    expect(STORAGE_KEY).toBe("cms-configurator-progress");
  });

  it("clears configurator progress from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "data");
    await resetConfiguratorProgress();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "/cms/api/configurator-progress",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
