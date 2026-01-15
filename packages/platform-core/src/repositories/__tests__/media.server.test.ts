import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { File } from "node:buffer";

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function createPngBuffer(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();
}

describe("media repository", () => {
  const origDataRoot = process.env.DATA_ROOT;

  let tmpRoot: string | undefined;

  beforeEach(async () => {
    jest.resetModules();
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "platform-core-media-"));
    process.env.DATA_ROOT = tmpRoot;
    await fs.mkdir(path.join(tmpRoot, "demo"), { recursive: true });
  });

  afterEach(async () => {
    jest.resetModules();
    if (origDataRoot === undefined) delete process.env.DATA_ROOT;
    else process.env.DATA_ROOT = origDataRoot;
    if (tmpRoot) {
      await fs.rm(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
    }
  });

  it("uploads, lists, updates metadata, and deletes (local backend)", async () => {
    const {
      uploadMediaFile,
      listMediaFiles,
      updateMediaMetadataEntry,
      deleteMediaFile,
      readMediaMetadata,
    } = await import("../media.server");

    const png = await createPngBuffer(32, 16);
    const file = new File([png], "hero.png", { type: "image/png" });

    const uploaded = await uploadMediaFile({
      shop: "demo",
      file,
      altText: "Hero image",
      tags: ["hero", "primary"],
      requiredOrientation: "landscape",
    });

    expect(uploaded.url).toMatch(/^\/uploads\/demo\/[a-z0-9]+\.png$/i);
    expect(uploaded.altText).toBe("Hero image");
    expect(uploaded.tags).toEqual(["hero", "primary"]);

    const filename = uploaded.url.split("/").pop()!;
    const expectedFilePath = path.join(tmpRoot!, "demo", "uploads", filename);
    const expectedMetaPath = path.join(tmpRoot!, "demo", "uploads", "metadata.json");

    expect(await pathExists(expectedFilePath)).toBe(true);
    expect(await pathExists(expectedMetaPath)).toBe(true);

    const meta = await readMediaMetadata("demo");
    expect(meta[filename]).toMatchObject({
      altText: "Hero image",
      tags: ["hero", "primary"],
      type: "image",
      storage: "local",
    });

    const listed = await listMediaFiles("demo");
    expect(listed.map((item) => item.url)).toContain(uploaded.url);

    const updated = await updateMediaMetadataEntry("demo", uploaded.url, {
      title: "Homepage hero",
      tags: ["homepage"],
    });
    expect(updated.title).toBe("Homepage hero");
    expect(updated.tags).toEqual(["homepage"]);

    await deleteMediaFile("demo", uploaded.url);
    expect(await pathExists(expectedFilePath)).toBe(false);

    const afterDelete = await listMediaFiles("demo");
    expect(afterDelete).toEqual([]);
  });

  it("enforces requiredOrientation for images", async () => {
    const { uploadMediaFile, MediaError } = await import("../media.server");

    const portraitPng = await createPngBuffer(16, 32);
    const file = new File([portraitPng], "portrait.png", { type: "image/png" });

    await expect(
      uploadMediaFile({
        shop: "demo",
        file,
        requiredOrientation: "landscape",
      }),
    ).rejects.toMatchObject<MediaError>({
      name: "MediaError",
      code: "ORIENTATION_LANDSCAPE_REQUIRED",
    });
  });
});
