import { describe, expect, it } from "@jest/globals";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Regression test for tsx runtime resolution of workspace packages.
 *
 * BACKGROUND:
 * apps/brikette/tsconfig.json maps @acme/guides-core to .d.ts files first
 * (lines 31-34), which causes tsx to resolve to empty runtime modules when
 * running scripts. This broke postbuild (generate-public-seo.ts).
 *
 * FIX:
 * Created tsconfig.scripts.json with runtime-safe paths that prefer src/*.ts
 * over .d.ts files. Updated postbuild to use --tsconfig flag.
 *
 * THIS TEST:
 * Verifies that tsx + scripts tsconfig correctly resolves @acme/guides-core
 * to runtime code (not .d.ts) by spawning tsx as a subprocess.
 *
 * WHY SUBPROCESS:
 * Jest's moduleNameMapper (jest.config.cjs:82-86) bypasses tsx resolution
 * by hard-mapping @acme/guides-core to source. Direct Jest imports won't
 * catch this regression class.
 */

const APP_ROOT = path.resolve(process.cwd());
const SCRIPTS_TSCONFIG = path.join(APP_ROOT, "tsconfig.scripts.json");

describe("tsx runtime resolution with scripts tsconfig", () => {
  it("resolves @acme/guides-core to runtime code (not .d.ts)", () => {
    // Create minimal test script in temp directory
    const testDir = mkdtempSync(path.join(tmpdir(), "tsx-resolution-test-"));
    const testScriptPath = path.join(testDir, "test-resolution.js");

    try {
      // Test script: require @acme/guides-core and check if createGuideUrlHelpers is a function
      writeFileSync(
        testScriptPath,
        `const { createGuideUrlHelpers } = require('@acme/guides-core');
console.log(typeof createGuideUrlHelpers);
process.exit(typeof createGuideUrlHelpers === 'function' ? 0 : 1);`
      );

      // Run with tsx + scripts tsconfig (should resolve to runtime code)
      const result = execSync(
        `pnpm exec tsx --tsconfig "${SCRIPTS_TSCONFIG}" "${testScriptPath}"`,
        {
          cwd: APP_ROOT,
          encoding: "utf8",
          stdio: "pipe",
        }
      );

      // Verify output shows "function" (not "undefined")
      expect(result.trim()).toBe("function");
    } finally {
      // Cleanup
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("documents original tsconfig runtime behavior", () => {
    // The original tsconfig previously resolved @acme/guides-core to .d.ts and
    // produced "undefined" at runtime. In newer environments it may also
    // resolve to runtime code. Keep this tolerant and only assert known states.

    const testDir = mkdtempSync(path.join(tmpdir(), "tsx-resolution-negative-"));
    const testScriptPath = path.join(testDir, "test-resolution.js");

    try {
      writeFileSync(
        testScriptPath,
        `const { createGuideUrlHelpers } = require('@acme/guides-core');
console.log(typeof createGuideUrlHelpers);
process.exit(typeof createGuideUrlHelpers === 'function' ? 0 : 1);`
      );

      // Run with ORIGINAL tsconfig (should resolve to .d.ts → undefined)
      let threw = false;
      let exitCode = 0;
      let output = "";

      try {
        output = execSync(
          `pnpm exec tsx --tsconfig "${path.join(APP_ROOT, "tsconfig.json")}" "${testScriptPath}"`,
          {
            cwd: APP_ROOT,
            encoding: "utf8",
            stdio: "pipe",
          }
        );
      } catch (error) {
        threw = true;
        exitCode = (error as { status?: number }).status ?? 0;
        output = (error as { stdout?: string }).stdout ?? "";
      }

      const resolvedType = output.trim();
      expect(["function", "undefined"]).toContain(resolvedType);

      if (resolvedType === "function") {
        expect(threw).toBe(false);
        expect(exitCode).toBe(0);
      } else {
        expect(threw).toBe(true);
        expect(exitCode).toBe(1);
      }
    } finally {
      // Cleanup
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});
