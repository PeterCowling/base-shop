import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";

import {
  atomicWrite,
  computeOutputFileNames,
  isFileEmpty,
  parseArgs,
  shouldOverwrite,
  verifyOutputExists,
} from "../s2-operator-capture";

describe("s2-operator-capture orchestrator", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(join(os.tmpdir(), "s2-operator-capture-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("parseArgs", () => {
    it("should parse --as-of and --output-dir", () => {
      const parsed = parseArgs(["--as-of", "2026-02-15", "--output-dir", "/tmp/test"]);
      expect(parsed.asOf).toBe("2026-02-15");
      expect(parsed.outputDir).toBe("/tmp/test");
    });

    it("should require --as-of", () => {
      expect(() => parseArgs([])).toThrow("missing_required_arg:--as-of");
    });

    it("should use default output dir if not provided", () => {
      const parsed = parseArgs(["--as-of", "2026-02-15"]);
      expect(parsed.outputDir).toContain("market-research/BRIK/data");
    });

    it("should reject unknown flags", () => {
      expect(() => parseArgs(["--as-of", "2026-02-15", "--unknown"])).toThrow(
        "unknown_arg:--unknown"
      );
    });

    it("should parse --replace-empty-scaffold flag", () => {
      const parsed = parseArgs(["--as-of", "2026-02-15", "--replace-empty-scaffold"]);
      expect(parsed.replaceEmptyScaffold).toBe(true);
    });
  });

  describe("computeOutputFileNames", () => {
    it("should generate dated CSV filenames", () => {
      const files = computeOutputFileNames("2026-02-15");
      expect(files).toEqual({
        parityScenarios: "2026-02-15-parity-scenarios.csv",
        bookingsByChannel: "2026-02-15-bookings-by-channel.csv",
        commissionByChannel: "2026-02-15-commission-by-channel.csv",
      });
    });
  });

  describe("isFileEmpty", () => {
    it("should return true for header-only CSV", async () => {
      const testFile = join(tmpDir, "header-only.csv");
      await fs.writeFile(testFile, "column1,column2,column3\n");
      const result = await isFileEmpty(testFile);
      expect(result).toBe(true);
    });

    it("should return true for scaffold-empty CSV with unavailable values", async () => {
      const testFile = join(tmpDir, "scaffold.csv");
      await fs.writeFile(
        testFile,
        "scenario,channel,total_price_all_in\nS1,Direct,unavailable\nS2,Direct,unavailable\n"
      );
      const result = await isFileEmpty(testFile);
      expect(result).toBe(true);
    });

    it("should return false for CSV with real data", async () => {
      const testFile = join(tmpDir, "real-data.csv");
      await fs.writeFile(testFile, "scenario,channel,total_price_all_in\nS1,Direct,45.50\n");
      const result = await isFileEmpty(testFile);
      expect(result).toBe(false);
    });

    it("should return true for non-existent file", async () => {
      const testFile = join(tmpDir, "does-not-exist.csv");
      const result = await isFileEmpty(testFile);
      expect(result).toBe(true);
    });
  });

  describe("shouldOverwrite", () => {
    it("should allow overwrite when file does not exist", async () => {
      const testFile = join(tmpDir, "does-not-exist.csv");
      const result = await shouldOverwrite(testFile, false);
      expect(result).toBe(true);
    });

    it("should allow overwrite when replace-empty-scaffold is true and file is empty", async () => {
      const testFile = join(tmpDir, "empty.csv");
      await fs.writeFile(testFile, "header\n");
      const result = await shouldOverwrite(testFile, true);
      expect(result).toBe(true);
    });

    it("should reject overwrite when file exists and replace-empty-scaffold is false", async () => {
      const testFile = join(tmpDir, "exists.csv");
      await fs.writeFile(testFile, "header\ndata\n");
      const result = await shouldOverwrite(testFile, false);
      expect(result).toBe(false);
    });

    it("should reject overwrite when file has real data even with replace-empty-scaffold", async () => {
      const testFile = join(tmpDir, "real-data.csv");
      await fs.writeFile(testFile, "scenario,channel,total_price_all_in\nS1,Direct,45.50\n");
      const result = await shouldOverwrite(testFile, true);
      expect(result).toBe(false);
    });
  });

  describe("verifyOutputExists", () => {
    it("should pass when all files exist and are non-empty", async () => {
      const file1 = join(tmpDir, "file1.csv");
      const file2 = join(tmpDir, "file2.csv");
      await fs.writeFile(file1, "header\ndata\n");
      await fs.writeFile(file2, "header\ndata\n");

      await expect(verifyOutputExists([file1, file2])).resolves.toBeUndefined();
    });

    it("should throw when any file does not exist", async () => {
      const file1 = join(tmpDir, "file1.csv");
      const file2 = join(tmpDir, "does-not-exist.csv");
      await fs.writeFile(file1, "header\ndata\n");

      await expect(verifyOutputExists([file1, file2])).rejects.toThrow("output_missing");
    });

    it("should throw when any file is empty", async () => {
      const file1 = join(tmpDir, "file1.csv");
      const file2 = join(tmpDir, "file2.csv");
      await fs.writeFile(file1, "header\ndata\n");
      await fs.writeFile(file2, "");

      await expect(verifyOutputExists([file1, file2])).rejects.toThrow("output_empty");
    });
  });

  describe("atomicWrite", () => {
    it("should write content atomically via .tmp file", async () => {
      const targetFile = join(tmpDir, "target.csv");
      await atomicWrite(targetFile, "test content\n");

      const content = await fs.readFile(targetFile, "utf-8");
      expect(content).toBe("test content\n");
    });

    it("should clean up .tmp file on write", async () => {
      const targetFile = join(tmpDir, "target.csv");
      await atomicWrite(targetFile, "test content\n");

      const tmpFile = `${targetFile}.tmp`;
      await expect(fs.access(tmpFile)).rejects.toThrow();
    });
  });
});
