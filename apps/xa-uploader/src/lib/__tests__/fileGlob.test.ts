/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader file glob tests rely on temp fs operations */

import { describe, expect, it } from "@jest/globals";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { expandFileSpec } from "@acme/lib/xa";

async function withTempDirs(
  run: (paths: { tempDir: string; baseDir: string; outsideDir: string }) => Promise<void>,
) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "xa-fileglob-"));
  const baseDir = path.join(tempDir, "base");
  const outsideDir = path.join(tempDir, "outside");

  try {
    await mkdir(baseDir, { recursive: true });
    await mkdir(outsideDir, { recursive: true });
    await run({ tempDir, baseDir, outsideDir });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

describe("fileGlob security boundaries", () => {
  it("blocks direct file traversal outside base directory", async () => {
    await withTempDirs(async ({ baseDir, outsideDir }) => {
      const outsidePng = path.join(outsideDir, "outside.png");
      await writeFile(outsidePng, Buffer.from("not-real-png"));

      await expect(
        expandFileSpec("../outside/outside.png", baseDir, { recursiveDirs: true }),
      ).rejects.toThrow(/outside allowed roots/i);
    });
  });

  it("blocks glob traversal outside base directory", async () => {
    await withTempDirs(async ({ baseDir, outsideDir }) => {
      await writeFile(path.join(outsideDir, "one.png"), Buffer.from("x"));
      await writeFile(path.join(outsideDir, "two.png"), Buffer.from("x"));

      await expect(
        expandFileSpec("../outside/*.png", baseDir, { recursiveDirs: true }),
      ).rejects.toThrow(/outside allowed roots/i);
    });
  });

  it("allows explicit additional roots when provided", async () => {
    await withTempDirs(async ({ baseDir, outsideDir }) => {
      const outsidePng = path.join(outsideDir, "outside.png");
      await writeFile(outsidePng, Buffer.from("not-real-png"));

      const result = await expandFileSpec("../outside/outside.png", baseDir, {
        recursiveDirs: true,
        allowedRoots: [".", "../outside"],
      });

      expect(result).toEqual([path.resolve(baseDir, "../outside/outside.png")]);
    });
  });
});
