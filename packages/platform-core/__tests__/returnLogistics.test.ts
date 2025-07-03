import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withConfig(
  config: any,
  cb: (mod: typeof import("../returnLogistics")) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "return-"));
  await fs.mkdir(path.join(dir, "data"), { recursive: true });
  await fs.writeFile(
    path.join(dir, "data", "return-logistics.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const mod = await import("../returnLogistics");
  try {
    await cb(mod);
  } finally {
    process.chdir(cwd);
  }
}

describe("return logistics config", () => {
  it("parses file once and caches result", async () => {
    const cfg = { labelService: "MockLabelCo", inStore: true };
    await withConfig(cfg, async ({ getReturnLogistics }) => {
      const first = await getReturnLogistics();
      const second = await getReturnLogistics();
      expect(first).toEqual(cfg);
      expect(second).toBe(first);
    });
  });
});
