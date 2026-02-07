import * as path from "path";

import type { SeoAuditEntry } from "../src/repositories/seoAudit.server";

describe("seoAudit JSON repo", () => {
  const shop = "test-shop";

  beforeEach(() => {
    jest.resetModules();
  });

  it("returns [] when the audit file is missing", async () => {
    const readFile = jest
      .fn<Promise<string>, [string, string]>()
      .mockRejectedValue(new Error("not found"));
    const appendFile = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, appendFile, mkdir } }));

    const { readSeoAudits } = await import(
      "../src/repositories/seoAudit.json.server"
    );
    const result = await readSeoAudits(shop);
    expect(result).toEqual([]);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("returns [] for empty files", async () => {
    const readFile = jest
      .fn<Promise<string>, [string, string]>()
      .mockResolvedValue("");
    const appendFile = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, appendFile, mkdir } }));

    const { readSeoAudits } = await import(
      "../src/repositories/seoAudit.json.server"
    );
    const result = await readSeoAudits(shop);
    expect(result).toEqual([]);
  });

  it("returns [] when JSON parsing fails", async () => {
    const readFile = jest
      .fn<Promise<string>, [string, string]>()
      .mockResolvedValue("not-json\n");
    const appendFile = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, appendFile, mkdir } }));

    const { readSeoAudits } = await import(
      "../src/repositories/seoAudit.json.server"
    );
    const result = await readSeoAudits(shop);
    expect(result).toEqual([]);
  });

  it("creates directories and appends newline-delimited JSON", async () => {
    const mkdir = jest
      .fn<Promise<void>, [string, { recursive: boolean }]>()
      .mockResolvedValue();
    const appendFile = jest
      .fn<Promise<void>, [string, string, string]>()
      .mockResolvedValue();
    const readFile = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, appendFile, mkdir } }));

    const { appendSeoAudit } = await import(
      "../src/repositories/seoAudit.json.server"
    );
    const entry: SeoAuditEntry = { timestamp: "1", score: 50 };
    await appendSeoAudit(shop, entry);

    const { DATA_ROOT } = await import("../src/dataRoot");
    const file = path.join(DATA_ROOT, shop, "seo-audits.jsonl");
    expect(mkdir).toHaveBeenCalledWith(path.dirname(file), { recursive: true });
    expect(appendFile).toHaveBeenCalledWith(
      file,
      JSON.stringify(entry) + "\n",
      "utf8"
    );
  });
});
