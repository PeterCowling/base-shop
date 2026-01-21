/** @jest-environment node */

import { MediaError } from "@acme/platform-core/repositories/media.errors";

import { deleteMedia } from "../media.server";

import {
  deleteMediaFile,
  ensureHasPermission,
  resetMediaMocks,
  restoreMediaMocks,
} from "./media.test.mocks";

describe("deleteMedia", () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it("delegates to platform-core", async () => {
    deleteMediaFile.mockResolvedValueOnce(undefined);
    await expect(deleteMedia("shop", "/uploads/shop/file.jpg")).resolves.toBeUndefined();
    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(deleteMediaFile).toHaveBeenCalledWith("shop", "/uploads/shop/file.jpg");
  });

  it("translates MediaError messages", async () => {
    deleteMediaFile.mockRejectedValueOnce(new MediaError("INVALID_FILE_PATH"));
    await expect(deleteMedia("shop", "/uploads/other/file.jpg")).rejects.toThrow("Invalid file path");
  });
});

