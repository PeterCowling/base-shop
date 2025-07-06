import { describe, expect, it } from "@jest/globals";
import { spawnSync, SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";

/**
 * Compiles apps/cms/src/app/globals.css with Tailwind and verifies
 * that the expected `--color-bg` custom property is present.
 *
 * Steps
 * 1. Resolve the repo-bundled Tailwind CLI.
 * 2. Build into an isolated temporary directory.
 * 3. Check exit status and emitted CSS.
 * 4. Always remove build artifacts, even if assertions fail.
 */
describe("tailwind build", () => {
  it("builds globals.css with tailwind", () => {
    let cliPath: string;

    try {
      cliPath = require.resolve("tailwindcss/lib/cli.js");
    } catch {
      // Gracefully skip when the CLI isn’t installed (e.g., slim CI jobs).
      console.warn("tailwindcss CLI not found, skipping test");
      return;
    }

    const tmpDir: string = mkdtempSync(join(os.tmpdir(), "tw-"));
    const outputPath: string = join(tmpDir, "out.css");

    const result: SpawnSyncReturns<Buffer> = spawnSync(
      process.execPath,
      [
        cliPath,
        "-i",
        "apps/cms/src/app/globals.css",
        "-c",
        "tailwind.config.mjs",
        "-o",
        outputPath,
      ],
      { stdio: "inherit" }
    );

    try {
      if (result.error) {
        // Surface low-level spawn/exec errors
        throw result.error;
      }

      expect(result.status).toBe(0);

      const css: string = readFileSync(outputPath, "utf8");
      expect(css).toContain("--color-bg");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
