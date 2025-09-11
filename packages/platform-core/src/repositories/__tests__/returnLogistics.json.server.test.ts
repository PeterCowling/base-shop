import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("return logistics JSON repository", () => {
  let baseDir: string;
  let file: string;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "return-log-"));
    process.env.DATA_ROOT = path.join(baseDir, "shops");
    file = path.join(baseDir, "return-logistics.json");
  });

  afterEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    jest.resetModules();
  });

  it("reads valid JSON", async () => {
    const valid = {
      labelService: "ups",
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      requireTags: true,
      allowWear: false,
    };
    await fs.writeFile(file, JSON.stringify(valid), "utf8");
    const { jsonReturnLogisticsRepository } = await import("../returnLogistics.json.server");
    await expect(jsonReturnLogisticsRepository.readReturnLogistics()).resolves.toEqual(
      valid
    );
  });

  it("throws on invalid data", async () => {
    await fs.writeFile(file, "{}", "utf8");
    const { jsonReturnLogisticsRepository } = await import("../returnLogistics.json.server");
    await expect(jsonReturnLogisticsRepository.readReturnLogistics()).rejects.toThrow(
      "Invalid return logistics data"
    );
  });
});
