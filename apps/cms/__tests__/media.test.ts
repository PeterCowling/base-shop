/* apps/cms/__tests__/media.test.ts */
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  Imports & global helpers                                                  */
/* -------------------------------------------------------------------------- */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

const { resetModules } = jest;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface MediaMeta {
  altText: string;
  type?: "image" | "video";
  width?: number;
  height?: number;
}
type MediaMetaFile = Record<string, MediaMeta>;

/* -------------------------------------------------------------------------- */
/*  Utility helpers                                                           */
/* -------------------------------------------------------------------------- */
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

function withDevEnv<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string>).NODE_ENV = "development";
  return fn().finally(() => {
    (process.env as Record<string, string>).NODE_ENV = prev;
  });
}

/* -------------------------------------------------------------------------- */
/*  Common mocks                                                              */
/* -------------------------------------------------------------------------- */
function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  }));
}

/**
 * A minimal Sharp stub that supports the chained methods used in
 * `uploadMedia`. All methods return `this`, and `toBuffer` resolves
 * to an empty buffer by default.
 */
function mockSharp({
  width = 2,
  height = 1,
  toBuffer = Buffer.alloc(0),
}: { width?: number; height?: number; toBuffer?: Buffer } = {}) {
  jest.doMock("sharp", () => {
    const chain = {
      metadata: jest.fn().mockResolvedValue({ width, height }),
      resize: () => chain,
      rotate: () => chain,
      jpeg: () => chain,
      png: () => chain,
      webp: () => chain,
      toBuffer: jest.fn().mockResolvedValue(toBuffer),
    };
    return { __esModule: true, default: () => chain };
  });
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("media actions", () => {
  afterEach(() => jest.resetAllMocks());

  it("listMedia returns empty array when dir missing", async () => {
    await withTmpDir(() =>
      withDevEnv(async () => {
        mockAuth();
        mockSharp();

        const { listMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
        );
        await expect(listMedia("shop1")).resolves.toEqual([]);
      })
    );
  }, 15_000);

  it("uploadMedia stores file, metadata and returns item", async () => {
    await withTmpDir((dir) =>
      withDevEnv(async () => {
        mockAuth();
        mockSharp({ toBuffer: Buffer.from("img") });

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
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

        /* ---------- assertions ---------- */
        expect(item.url).toMatch(/\/uploads\/shop1\//);
        expect(item.altText).toBe("hello");
        expect(item.type).toBe("image");

        const stored = path.join(dir, "public", item.url);
        await expect(fs.access(stored)).resolves.toBeUndefined();

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
        expect(meta[path.basename(item.url)].altText).toBe("hello");
        expect(meta[path.basename(item.url)].type).toBe("image");
      })
    );
  });

  it("uploadMedia stores video files", async () => {
    await withTmpDir((dir) =>
      withDevEnv(async () => {
        mockAuth();
        mockSharp();

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
        );

        const file = new File(["vid"], "test.mp4", { type: "video/mp4" });
        const fd = new FormData();
        fd.append("file", file);

        const item = await uploadMedia("shop1", fd);

        expect(item.type).toBe("video");

        const stored = path.join(dir, "public", item.url);
        await expect(fs.access(stored)).resolves.toBeUndefined();

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
        expect(meta[path.basename(item.url)].type).toBe("video");
      })
    );
  });

  it("uploadMedia rejects invalid file type", async () => {
    await withTmpDir(() =>
      withDevEnv(async () => {
        mockAuth();
        mockSharp();

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
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
    await withTmpDir(() =>
      withDevEnv(async () => {
        mockAuth();
        mockSharp({ width: 1, height: 2 });

        const { uploadMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
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
    await withTmpDir(() =>
      withDevEnv(async () => {
        mockAuth();

        const { deleteMedia } = await import(
          /* @vite-ignore */ "../src/actions/media.server.ts"
        );

        await expect(
          deleteMedia("shop1", "/uploads/shop1/../evil.png")
        ).rejects.toThrow("Invalid file path");
      })
    );
  });
});
