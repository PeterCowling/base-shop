// packages/platform-core/__tests__/media.test.ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

const { resetModules } = jest;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a fresh tmp dir, runs `cb`, then restores CWD. */
async function withTmpDir(cb: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "media-"));
  const cwd = process.cwd();
  process.chdir(dir);
  resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("media actions", () => {
  afterEach(() => jest.resetAllMocks());

  it("listMedia returns empty array when dir missing", async () => {
    await withTmpDir(async () => {
      const prevEnv = process.env.NODE_ENV;
      (process.env as Record<string, string>)["NODE_ENV"] = "development";
      jest.doMock("next-auth", () => ({
        getServerSession: jest
          .fn()
          .mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("sharp", () => ({
        __esModule: true,
        default: () => ({
          metadata: jest.fn().mockResolvedValue({ width: 2, height: 1 }),
        }),
      }));

      const { listMedia } = await import(
        /* @vite-ignore */ "../src/actions/media"
      );
      const files = await listMedia("shop1");
      expect(files).toEqual([]);
      (process.env as Record<string, string>)["NODE_ENV"] = prevEnv;
    });
  });

  it("uploadMedia stores file, metadata and returns item", async () => {
    await withTmpDir(async (dir) => {
      const prevEnv = process.env.NODE_ENV;
      (process.env as Record<string, string>)["NODE_ENV"] = "development";
      jest.doMock("next-auth", () => ({
        getServerSession: jest
          .fn()
          .mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("sharp", () => ({
        __esModule: true,
        default: () => ({
          metadata: jest.fn().mockResolvedValue({ width: 2, height: 1 }),
        }),
      }));

      const { uploadMedia } = await import(
        /* @vite-ignore */ "../src/actions/media"
      );

      const data = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAD0lEQVR4nGP4z8Dwn4EBAAj+Af9IxWaQAAAAAElFTkSuQmCC",
        "base64"
      );
      const file = new File([data], "test.png", { type: "image/png" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("altText", "hello");

      const item = await uploadMedia("shop1", fd);
      expect(item.url).toMatch(/\/uploads\/shop1\//);
      expect(item.altText).toBe("hello");

      const stored = path.join(dir, "public", item.url);
      await expect(fs.access(stored)).resolves.toBeUndefined();

      const metaPath = path.join(
        dir,
        "public",
        "uploads",
        "shop1",
        "metadata.json"
      );
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      const filename = path.basename(item.url);
      expect(meta[filename].altText).toBe("hello");
      (process.env as Record<string, string>)["NODE_ENV"] = prevEnv;
    });
  });
});
