import { promises as fs } from "fs";
import path from "path";
import os from "os";
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
      expect(resolved).toBe(shops);
    } finally {
      process.chdir(original);
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});

