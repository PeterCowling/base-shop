import { promises as fs } from "node:fs";
import * as path from "node:path";

import { readPricing, writePricing } from "../pricing.server";

jest.mock("../../dataRoot", () => ({
  resolveDataRoot: jest.fn(() => "/data/root"),
}));

jest.mock("node:fs", () => ({
  promises: {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
  },
}));

describe("pricing repository", () => {
  const readFile = fs.readFile as jest.Mock;
  const mkdir = fs.mkdir as jest.Mock;
  const writeFile = fs.writeFile as jest.Mock;
  const rename = fs.rename as jest.Mock;

  const validData = {
    baseDailyRate: 10,
    durationDiscounts: [],
    damageFees: {},
    coverage: {},
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("readPricing", () => {
    it("parses valid JSON", async () => {
      readFile.mockResolvedValue(JSON.stringify(validData));
      await expect(readPricing()).resolves.toEqual(validData);
    });

    it("throws 404-like error when file missing", async () => {
      const err = Object.assign(new Error("missing"), { code: "ENOENT" });
      readFile.mockRejectedValue(err);
      await expect(readPricing()).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("throws on invalid JSON", async () => {
      readFile.mockResolvedValue("{}");
      await expect(readPricing()).rejects.toThrow("Invalid pricing data");
    });
  });

  describe("writePricing", () => {
    it("writes data atomically", async () => {
      const now = 123456789;
      jest.spyOn(Date, "now").mockReturnValue(now);

      await writePricing(validData);

      const file = path.join("/data/root", "..", "rental", "pricing.json");
      const dir = path.dirname(file);
      const tmp = `${file}.${now}.tmp`;

      expect(mkdir).toHaveBeenCalledWith(dir, { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(
        tmp,
        JSON.stringify(validData, null, 2),
        "utf8"
      );
      expect(rename).toHaveBeenCalledWith(tmp, file);
    });

    it("validates structure before writing", async () => {
      await expect(writePricing({} as any)).rejects.toThrow(
        "Invalid pricing data",
      );
      expect(writeFile).not.toHaveBeenCalled();
    });
  });
});

