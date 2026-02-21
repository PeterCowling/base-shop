/** @jest-environment node */

import { MediaError } from "@acme/platform-core/repositories/media.errors";

import {
  deleteMediaFile,
  ensureHasPermission,
  resetMediaMocks,
  restoreMediaMocks,
} from "./media.test.mocks";

describe("deleteMedia", () => {
  beforeEach(() => {
    jest.resetModules();
    resetMediaMocks();
  });
  afterEach(restoreMediaMocks);

  it("delegates to platform-core", async () => {
    const { deleteMedia } = await import("../media.server");
    deleteMediaFile.mockResolvedValueOnce(undefined);
    await expect(deleteMedia("shop", "/uploads/shop/file.jpg")).resolves.toBeUndefined();
    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(deleteMediaFile).toHaveBeenCalledWith("shop", "/uploads/shop/file.jpg");
  });

  it("translates MediaError messages", async () => {
    const { deleteMedia } = await import("../media.server");
    deleteMediaFile.mockRejectedValueOnce(new MediaError("INVALID_FILE_PATH"));
    await expect(deleteMedia("shop", "/uploads/other/file.jpg")).rejects.toThrow("Invalid file path");
  });
});
