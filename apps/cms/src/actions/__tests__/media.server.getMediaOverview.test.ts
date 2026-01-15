/** @jest-environment node */

import {
  ensureHasPermission,
  getMediaOverviewForShop,
  resetMediaMocks,
  restoreMediaMocks,
} from "./media.test.mocks";
import { getMediaOverview } from "../media.server";

describe("getMediaOverview", () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it("delegates to platform-core", async () => {
    const overview = {
      files: [{ url: "/uploads/shop/a.jpg", type: "image" }],
      totalBytes: 100,
      imageCount: 1,
      videoCount: 0,
      recentUploads: [{ url: "/uploads/shop/a.jpg", type: "image" }],
    };
    getMediaOverviewForShop.mockResolvedValueOnce(overview);

    await expect(getMediaOverview("shop")).resolves.toBe(overview);
    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(getMediaOverviewForShop).toHaveBeenCalledWith("shop");
  });
});

