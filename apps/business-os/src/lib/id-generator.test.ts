import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  generateBusinessOsId,
  getValidBusinessIds,
  validateBusinessId,
} from "./id-generator";
import { mkdirWithinRoot, writeFileWithinRoot } from "./safe-fs";

describe("id-generator", () => {
  let tempDir: string;
  let businessOsPath: string;

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-test-"));
    businessOsPath = path.join(tempDir, "docs/business-os");

    // Create directory structure
    await mkdirWithinRoot(tempDir, path.join(businessOsPath, "ideas/inbox/archive"), {
      recursive: true,
    });
    await mkdirWithinRoot(tempDir, path.join(businessOsPath, "ideas/worked/archive"), {
      recursive: true,
    });
    await mkdirWithinRoot(tempDir, path.join(businessOsPath, "cards/archive"), {
      recursive: true,
    });
    await mkdirWithinRoot(tempDir, path.join(businessOsPath, "strategy"), {
      recursive: true,
    });

    // Create business catalog
    const catalog = {
      businesses: [
        { id: "PLAT", name: "Platform" },
        { id: "BRIK", name: "Brikette" },
        { id: "BOS", name: "Business OS" },
      ],
      metadata: { version: "1.0.0" },
    };
    await writeFileWithinRoot(
      tempDir,
      path.join(businessOsPath, "strategy/businesses.json"),
      JSON.stringify(catalog, null, 2)
    );
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("generateBusinessOsId", () => {
    it("generates first ID when no existing IDs", async () => {
      const id = await generateBusinessOsId("BRIK", tempDir);
      expect(id).toBe("BRIK-OPP-0001");
    });

    it("increments from highest existing ID in inbox", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0001.user.md"),
        "# Test"
      );
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0003.user.md"),
        "# Test"
      );

      const id = await generateBusinessOsId("BRIK", tempDir);
      expect(id).toBe("BRIK-OPP-0004");
    });

    it("increments from highest existing ID in worked", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/worked/PLAT-OPP-0005.user.md"),
        "# Test"
      );

      const id = await generateBusinessOsId("PLAT", tempDir);
      expect(id).toBe("PLAT-OPP-0006");
    });

    it("increments from highest existing card directory", async () => {
      await mkdirWithinRoot(tempDir, path.join(businessOsPath, "cards/BOS-OPP-0010"), {
        recursive: true,
      });

      const id = await generateBusinessOsId("BOS", tempDir);
      expect(id).toBe("BOS-OPP-0011");
    });

    it("scans across all locations including archives", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0002.user.md"),
        "# Test"
      );
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/archive/BRIK-OPP-0005.user.md"),
        "# Test"
      );
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/worked/BRIK-OPP-0003.user.md"),
        "# Test"
      );
      await mkdirWithinRoot(tempDir, path.join(businessOsPath, "cards/BRIK-OPP-0004"), {
        recursive: true,
      });

      const id = await generateBusinessOsId("BRIK", tempDir);
      expect(id).toBe("BRIK-OPP-0006");
    });

    it("handles agent.md extension", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/PLAT-OPP-0001.agent.md"),
        "# Test"
      );

      const id = await generateBusinessOsId("PLAT", tempDir);
      expect(id).toBe("PLAT-OPP-0002");
    });

    it("ignores other business IDs", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/BRIK-OPP-0050.user.md"),
        "# Test"
      );
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/PLAT-OPP-0010.user.md"),
        "# Test"
      );

      const id = await generateBusinessOsId("PLAT", tempDir);
      expect(id).toBe("PLAT-OPP-0011");
    });

    it("ignores .gitkeep files", async () => {
      await writeFileWithinRoot(
        tempDir,
        path.join(businessOsPath, "ideas/inbox/archive/.gitkeep"),
        ""
      );

      const id = await generateBusinessOsId("BRIK", tempDir);
      expect(id).toBe("BRIK-OPP-0001");
    });
  });

  describe("validateBusinessId", () => {
    it("returns true for valid business ID", async () => {
      const valid = await validateBusinessId("BRIK", tempDir);
      expect(valid).toBe(true);
    });

    it("returns false for invalid business ID", async () => {
      const valid = await validateBusinessId("INVALID", tempDir);
      expect(valid).toBe(false);
    });

    it("returns false when catalog missing", async () => {
      await fs.rm(path.join(businessOsPath, "strategy/businesses.json"));
      const valid = await validateBusinessId("BRIK", tempDir);
      expect(valid).toBe(false);
    });
  });

  describe("getValidBusinessIds", () => {
    it("returns all business IDs from catalog", async () => {
      const ids = await getValidBusinessIds(tempDir);
      expect(ids).toEqual(["PLAT", "BRIK", "BOS"]);
    });

    it("returns empty array when catalog missing", async () => {
      await fs.rm(path.join(businessOsPath, "strategy/businesses.json"));
      const ids = await getValidBusinessIds(tempDir);
      expect(ids).toEqual([]);
    });
  });
});
