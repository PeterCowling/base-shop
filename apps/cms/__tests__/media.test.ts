// packages/platform-core/__tests__/media.test.ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
  it("listMedia returns empty array when dir missing", async () => {
    await withTmpDir(async () => {
      const { listMedia } = await import(
        /* @vite-ignore */ "../src/actions/media"
      );
      const files = await listMedia("shop1");
      expect(files).toEqual([]);
    });
  });

  it("uploadMedia stores file and returns path", async () => {
    await withTmpDir(async (dir) => {
      const { uploadMedia } = await import(
        /* @vite-ignore */ "../src/actions/media"
      );

      const file = new File(["data"], "test.txt", { type: "text/plain" });
      const fd = new FormData();
      fd.append("file", file);

      const url = await uploadMedia("shop1", fd);
      expect(url).toMatch(/\/uploads\/shop1\//);

      const stored = path.join(dir, "public", url);
      await expect(fs.access(stored)).resolves.toBeUndefined();
    });
  });
});
