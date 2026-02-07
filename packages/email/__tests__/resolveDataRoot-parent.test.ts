import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { resolveDataRoot } from "../src/cli";

// Ensure temporary directories are removed after test

describe("resolveDataRoot", () => {
  it("walks up to parent data/shops", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "email-cli-test-"));
    const shops = path.join(tmp, "data", "shops");
    const nested = path.join(tmp, "nested", "workdir");
    await fs.mkdir(shops, { recursive: true });
    await fs.mkdir(nested, { recursive: true });

    const original = process.cwd();
    try {
      process.chdir(nested);
      const resolved = resolveDataRoot();
      expect(await fs.realpath(resolved)).toBe(await fs.realpath(shops));
    } finally {
      process.chdir(original);
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("falls back to cwd/data/shops when none found", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "email-cli-test-"));
    const nested = path.join(tmp, "nested", "workdir");
    await fs.mkdir(nested, { recursive: true });

    const original = process.cwd();
    try {
      process.chdir(nested);
      const resolved = resolveDataRoot();
      const realNested = await fs.realpath(nested);
      expect(resolved).toBe(path.join(realNested, "data", "shops"));
    } finally {
      process.chdir(original);
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});

