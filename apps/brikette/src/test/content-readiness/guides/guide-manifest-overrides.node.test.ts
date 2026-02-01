import fs from "fs";
import os from "os";
import path from "path";

import {
  getGuideManifestOverrideFromFs,
  loadGuideManifestOverridesFromFs,
  setGuideManifestOverrideToFs,
  writeGuideManifestOverridesToFs,
} from "@/routes/guides/guide-manifest-overrides.node";

describe("guide-manifest-overrides.node", () => {
  let tempDir: string;
  let dataDir: string;
  let guidesDir: string;
  let overridesPath: string;
  let backupPath: string;

  beforeEach(() => {
    // Create temp directory structure: tempDir/src/data/guides/
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "guide-overrides-test-"));
    dataDir = path.join(tempDir, "src", "data");
    guidesDir = path.join(dataDir, "guides");
    fs.mkdirSync(guidesDir, { recursive: true });
    overridesPath = path.join(guidesDir, "guide-manifest-overrides.json");
    backupPath = path.join(guidesDir, "guide-manifest-overrides.json.bak");
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("loadGuideManifestOverridesFromFs", () => {
    it("returns empty object when file does not exist", () => {
      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({});
    });

    it("returns empty object when file is empty", () => {
      fs.writeFileSync(overridesPath, "{}", "utf8");
      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({});
    });

    it("loads valid overrides from file", () => {
      const overrides = {
        testGuide: { areas: ["help"], primaryArea: "help" },
      };
      fs.writeFileSync(overridesPath, JSON.stringify(overrides), "utf8");
      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual(overrides);
    });

    it("returns empty object for malformed JSON", () => {
      fs.writeFileSync(overridesPath, "{ invalid json", "utf8");
      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({});
    });

    it("returns empty object for invalid schema", () => {
      const invalid = {
        testGuide: { areas: ["help"], primaryArea: "experience" }, // primaryArea not in areas
      };
      fs.writeFileSync(overridesPath, JSON.stringify(invalid), "utf8");
      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({});
    });
  });

  describe("writeGuideManifestOverridesToFs", () => {
    it("writes valid overrides to file", () => {
      const overrides = {
        testGuide: { areas: ["experience"], primaryArea: "experience" },
      };
      writeGuideManifestOverridesToFs(overrides, tempDir);

      const content = fs.readFileSync(overridesPath, "utf8");
      expect(JSON.parse(content)).toEqual(overrides);
    });

    it("creates backup of existing file", () => {
      const initial = { oldGuide: { areas: ["help"] } };
      fs.writeFileSync(overridesPath, JSON.stringify(initial), "utf8");

      const updated = { newGuide: { areas: ["experience"] } };
      writeGuideManifestOverridesToFs(updated, tempDir);

      expect(fs.existsSync(backupPath)).toBe(true);
      const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
      expect(backup).toEqual(initial);
    });

    it("creates directory if it does not exist", () => {
      const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), "guide-overrides-new-"));
      const newDataDir = path.join(newTempDir, "src", "data");
      // Don't create the guides directory

      try {
        const overrides = { testGuide: { areas: ["help"] } };
        writeGuideManifestOverridesToFs(overrides, newTempDir);

        const newOverridesPath = path.join(newDataDir, "guides", "guide-manifest-overrides.json");
        expect(fs.existsSync(newOverridesPath)).toBe(true);
      } finally {
        fs.rmSync(newTempDir, { recursive: true, force: true });
      }
    });

    it("throws for invalid overrides", () => {
      const invalid = {
        testGuide: { areas: ["help"], primaryArea: "experience" },
      };
      expect(() => writeGuideManifestOverridesToFs(invalid, tempDir)).toThrow();
    });

    it("writes atomically (no partial writes)", () => {
      const overrides = { testGuide: { areas: ["help"], primaryArea: "help" } };
      writeGuideManifestOverridesToFs(overrides, tempDir);

      // Temp file should not exist after successful write
      const tempFilePath = `${overridesPath}.tmp`;
      expect(fs.existsSync(tempFilePath)).toBe(false);
    });
  });

  describe("getGuideManifestOverrideFromFs", () => {
    it("returns override for existing guide", () => {
      const overrides = {
        testGuide: { areas: ["help", "experience"], primaryArea: "help" },
      };
      fs.writeFileSync(overridesPath, JSON.stringify(overrides), "utf8");

      const result = getGuideManifestOverrideFromFs("testGuide" as never, tempDir);
      expect(result).toEqual({ areas: ["help", "experience"], primaryArea: "help" });
    });

    it("returns undefined for non-existent guide", () => {
      const overrides = { otherGuide: { areas: ["help"] } };
      fs.writeFileSync(overridesPath, JSON.stringify(overrides), "utf8");

      const result = getGuideManifestOverrideFromFs("testGuide" as never, tempDir);
      expect(result).toBeUndefined();
    });
  });

  describe("setGuideManifestOverrideToFs", () => {
    it("adds new override", () => {
      setGuideManifestOverrideToFs(
        "testGuide" as never,
        { areas: ["experience"], primaryArea: "experience" },
        tempDir,
      );

      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({
        testGuide: { areas: ["experience"], primaryArea: "experience" },
      });
    });

    it("updates existing override", () => {
      const initial = { testGuide: { areas: ["help"], primaryArea: "help" } };
      fs.writeFileSync(overridesPath, JSON.stringify(initial), "utf8");

      setGuideManifestOverrideToFs(
        "testGuide" as never,
        { areas: ["experience"], primaryArea: "experience" },
        tempDir,
      );

      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({
        testGuide: { areas: ["experience"], primaryArea: "experience" },
      });
    });

    it("removes override when undefined is passed", () => {
      const initial = {
        testGuide: { areas: ["help"] },
        otherGuide: { areas: ["experience"] },
      };
      fs.writeFileSync(overridesPath, JSON.stringify(initial), "utf8");

      setGuideManifestOverrideToFs("testGuide" as never, undefined, tempDir);

      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({ otherGuide: { areas: ["experience"] } });
    });

    it("preserves other overrides when updating one", () => {
      const initial = {
        guideA: { areas: ["help"] },
        guideB: { areas: ["experience"] },
      };
      fs.writeFileSync(overridesPath, JSON.stringify(initial), "utf8");

      setGuideManifestOverrideToFs(
        "guideA" as never,
        { areas: ["howToGetHere"], primaryArea: "howToGetHere" },
        tempDir,
      );

      const result = loadGuideManifestOverridesFromFs(tempDir);
      expect(result).toEqual({
        guideA: { areas: ["howToGetHere"], primaryArea: "howToGetHere" },
        guideB: { areas: ["experience"] },
      });
    });
  });
});
