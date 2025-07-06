import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

const { resetModules } = jest;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ImageMeta {
  altText: string;
  width?: number;
  height?: number;
}

/** Shape of public/uploads/<shop>/metadata.json */
type MediaMetaFile = Record<string, ImageMeta>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/** Convenience helper to patch NODE_ENV and restore afterwards */
function withDevEnv<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string>).NODE_ENV = "development";
  return fn().finally(() => {
    (process.env as Record<string, string>).NODE_ENV = prev;
  });
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("media actions", () => {
  afterEach(() => jest.resetAllMocks());

  it("listMedia returns empty array when dir missing", async () => {
    await withTmpDir(async () =>
      withDevEnv(async () => {
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
          /* @vite-ignore */ "../src/actions/media.server.js"
        );
        const files = await listMedia("shop1");
        expect(files).toEqual([]);
      })
    );
  });

  it("uploadMedia stores file, metadata and returns item", async () => {
    await withTmpDir(async (dir) =>
      withDevEnv(async () => {
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
          /* @vite-ignore */ "../src/actions/media.server.js"
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

        /* ---------- file was written ---------- */
        const storedPath = path.join(dir, "public", item.url);
        await expect(fs.access(storedPath)).resolves.toBeUndefined();

        /* ---------- metadata was updated ------ */
        const metaPath = path.join(
          dir,
          "public",
          "uploads",
          "shop1",
          "metadata.json"
        );
        const meta = JSON.parse(
          await fs.readFile(metaPath, "utf8")
        ) as MediaMetaFile;

        const filename = path.basename(item.url);
        expect(meta[filename].altText).toBe("hello");
      })
    );
  });

  it("uploadMedia rejects invalid file type", async () => {
    await withTmpDir(async () =>
      withDevEnv(async () => {
        jest.doMock("next-auth", () => ({
          getServerSession: jest
            .fn()
            .mockResolvedValue({ user: { role: "admin" } }),
        }));
        jest.doMock("sharp", () => ({
          __esModule: true,
          default: () => ({ metadata: jest.fn() }),
        }));

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.js"
        );

        const file = new File(["bad"], "test.txt", { type: "text/plain" });
        const fd = new FormData();
        fd.append("file", file);

        await expect(uploadMedia("shop1", fd)).rejects.toThrow(
          "Invalid file type"
        );
      })
    );
  });

  it("uploadMedia enforces orientation", async () => {
    await withTmpDir(async () =>
      withDevEnv(async () => {
        jest.doMock("next-auth", () => ({
          getServerSession: jest
            .fn()
            .mockResolvedValue({ user: { role: "admin" } }),
        }));
        jest.doMock("sharp", () => ({
          __esModule: true,
          default: () => ({
            metadata: jest.fn().mockResolvedValue({ width: 1, height: 2 }),
          }),
        }));

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.js"
        );

        const data = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAD0lEQVR4nGP4z8Dwn4EBAAj+Af9IxWaQAAAAAElFTkSuQmCC",
          "base64"
        );
        const file = new File([data], "test.png", { type: "image/png" });
        const fd = new FormData();
        fd.append("file", file);

        await expect(uploadMedia("shop1", fd, "landscape")).rejects.toThrow(
          "Image orientation must be landscape"
        );
      })
    );
  });

  it("deleteMedia prevents path traversal", async () => {
    await withTmpDir(async () =>
      withDevEnv(async () => {
        jest.doMock("next-auth", () => ({
          getServerSession: jest
            .fn()
            .mockResolvedValue({ user: { role: "admin" } }),
        }));

        const { deleteMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.js"
        );

        await expect(
          deleteMedia("shop1", "/uploads/shop1/../evil.png")
        ).rejects.toThrow("Invalid file path");
      })
    );
  });
});
