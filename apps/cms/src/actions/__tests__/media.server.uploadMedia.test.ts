/** @jest-environment node */

import { File as NodeFile } from "node:buffer";

import { MediaError } from "@acme/platform-core/repositories/media.errors";

import { uploadMedia } from "../media.server";

import {
  ensureHasPermission,
  resetMediaMocks,
  restoreMediaMocks,
  uploadMediaFile,
} from "./media.test.mocks";
// Cast to globalThis.File since buffer.File lacks webkitRelativePath
const File = NodeFile as unknown as typeof globalThis.File;

describe("uploadMedia", () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it("throws when no file entry is provided", async () => {
    const formData = new FormData();
    await expect(uploadMedia("shop", formData)).rejects.toThrow("No file provided");
  });

  it("throws for invalid file entry type", async () => {
    const formData = new FormData();
    formData.append("file", "not a file");
    await expect(uploadMedia("shop", formData)).rejects.toThrow("No file provided");
  });

  it("delegates to platform-core and parses tags", async () => {
    const result = { url: "/uploads/shop/file.jpg", type: "image" };
    uploadMediaFile.mockResolvedValueOnce(result);

    const formData = new FormData();
    formData.append("file", new File(["img"], "photo.jpg", { type: "image/jpeg" }));
    formData.append("title", "My Image");
    formData.append("altText", "Alt text");
    formData.append("tags", '["featured"," hero "]');

    await expect(uploadMedia("shop", formData, "portrait")).resolves.toBe(result);
    expect(ensureHasPermission).toHaveBeenCalledWith("manage_media");
    expect(uploadMediaFile).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "shop",
        title: "My Image",
        altText: "Alt text",
        tags: ["featured", "hero"],
        requiredOrientation: "portrait",
      }),
    );
  });

  it("translates MediaError messages", async () => {
    uploadMediaFile.mockRejectedValueOnce(new MediaError("INVALID_FILE_TYPE"));
    const formData = new FormData();
    formData.append("file", new File(["txt"], "note.txt", { type: "text/plain" }));
    await expect(uploadMedia("shop", formData)).rejects.toThrow("Invalid file type");
  });

  it("passes through non-media errors", async () => {
    uploadMediaFile.mockRejectedValueOnce(new Error("boom"));
    const formData = new FormData();
    formData.append("file", new File(["img"], "photo.jpg", { type: "image/jpeg" }));
    await expect(uploadMedia("shop", formData)).rejects.toThrow("boom");
  });
});

