/** @jest-environment node */

import {
  ensureHasPermission,
  listMediaFiles,
  resetMediaMocks,
  restoreMediaMocks,
} from "./media.test.mocks";

describe("listMedia", () => {
  beforeEach(() => {
    jest.resetModules();
    resetMediaMocks();
  });
  afterEach(restoreMediaMocks);

  it("delegates to platform-core", async () => {
    const { listMedia } = await import("../media.server");
    const files = [{ url: "/uploads/shop/a.jpg", type: "image" }];
    listMediaFiles.mockResolvedValueOnce(files);
    await expect(listMedia("shop")).resolves.toEqual(files);
    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(listMediaFiles).toHaveBeenCalledWith("shop");
  });

  it("returns empty array when storage layer throws ENOENT", async () => {
    const { listMedia } = await import("../media.server");
    listMediaFiles.mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
    await expect(listMedia("shop")).resolves.toEqual([]);
  });

  it("throws a generic error for other failures", async () => {
    const { listMedia } = await import("../media.server");
    listMediaFiles.mockRejectedValueOnce(new Error("boom"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(listMedia("shop")).rejects.toThrow("Failed to list media");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
