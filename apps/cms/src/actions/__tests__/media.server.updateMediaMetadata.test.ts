/** @jest-environment node */

import { MediaError } from "@acme/platform-core/repositories/media.errors";
import {
  ensureHasPermission,
  resetMediaMocks,
  restoreMediaMocks,
  updateMediaMetadataEntry,
} from "./media.test.mocks";
import { updateMediaMetadata } from "../media.server";

describe("updateMediaMetadata", () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it("delegates to platform-core and returns the updated item", async () => {
    const item = { url: "/uploads/shop/file.jpg", title: "New", type: "image" };
    updateMediaMetadataEntry.mockResolvedValueOnce(item);

    await expect(
      updateMediaMetadata("shop", "/uploads/shop/file.jpg", { title: "New" }),
    ).resolves.toBe(item);

    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(updateMediaMetadataEntry).toHaveBeenCalledWith("shop", "/uploads/shop/file.jpg", {
      title: "New",
    });
  });

  it("translates MediaError messages", async () => {
    updateMediaMetadataEntry.mockRejectedValueOnce(new MediaError("NOT_FOUND"));
    await expect(
      updateMediaMetadata("shop", "/uploads/shop/missing.jpg", {}),
    ).rejects.toThrow("Media file not found");
  });
});

