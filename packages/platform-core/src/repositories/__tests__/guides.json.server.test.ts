import { jest } from "@jest/globals";

const guide = {
  id: "g1",
  shop: "demo",
  status: "published",
  row_version: 2,
  created_at: "2020-01-01T00:00:00.000Z",
  updated_at: "2020-01-01T00:00:00.000Z",
  key: "positanoGuide",
  slug: "positano-guide",
  contentKey: "positanoGuide",
  areas: ["transport"],
  primaryArea: "transport",
  blocks: [],
  relatedGuides: [],
  structuredData: [],
  riskTier: 0 as const,
  schemaVersion: 1,
};

describe("jsonGuidesRepository", () => {
  const shop = "demo";

  beforeEach(() => {
    jest.resetModules();
    process.env.DATA_ROOT = "/tmp/data";
  });

  it("returns [] when metadata file is missing", async () => {
    const readFile = jest.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.read(shop)).resolves.toEqual([]);
  });

  it("reads parsed guides from metadata file", async () => {
    const readFile = jest.fn().mockResolvedValue(JSON.stringify([guide]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.read(shop)).resolves.toEqual([guide]);
  });

  it("writes metadata atomically and ensures directory", async () => {
    const readFile = jest.fn();
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await jsonGuidesRepository.write(shop, [guide]);

    const tmpPath = String(writeFile.mock.calls[0]?.[0]);
    const finalPath = "/tmp/data/demo/guides.json";
    expect(tmpPath).toContain(`${finalPath}.`);
    expect(tmpPath).toContain(".tmp");
    expect(rename).toHaveBeenCalledWith(tmpPath, finalPath);
    expect(mkdir).toHaveBeenCalledWith("/tmp/data/demo", { recursive: true });
  });

  it("getById and getByKey return matching guides or null", async () => {
    const readFile = jest.fn().mockResolvedValue(JSON.stringify([guide]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.getById(shop, "g1")).resolves.toEqual(guide);
    await expect(jsonGuidesRepository.getById(shop, "missing")).resolves.toBeNull();
    await expect(jsonGuidesRepository.getByKey(shop, "positanoGuide")).resolves.toEqual(guide);
    await expect(jsonGuidesRepository.getByKey(shop, "missing")).resolves.toBeNull();
  });

  it("update increments row_version and merges patch", async () => {
    const readFile = jest.fn().mockResolvedValue(JSON.stringify([guide]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    const updated = await jsonGuidesRepository.update(shop, {
      id: "g1",
      status: "review",
    });

    expect(updated.status).toBe("review");
    expect(updated.row_version).toBe(3);
    const written = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(written[0].status).toBe("review");
    expect(written[0].row_version).toBe(3);
  });

  it("update throws when guide is missing", async () => {
    const readFile = jest.fn().mockResolvedValue("[]");
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(
      jsonGuidesRepository.update(shop, { id: "missing", status: "review" } as never),
    ).rejects.toThrow("Guide missing not found in demo");
  });

  it("delete removes a guide and throws when missing", async () => {
    const readFile = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify([guide]))
      .mockResolvedValueOnce(JSON.stringify([guide]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await jsonGuidesRepository.delete(shop, "g1");
    const written = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(written).toHaveLength(0);

    await expect(jsonGuidesRepository.delete(shop, "missing")).rejects.toThrow(
      "Guide missing not found in demo",
    );
  });

  it("duplicate creates draft copy with new id and timestamps", async () => {
    const readFile = jest.fn().mockResolvedValue(JSON.stringify([guide]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("ulid", () => ({ ulid: () => "new-guide-id" }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2026-02-09T12:00:00.000Z" }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    const copy = await jsonGuidesRepository.duplicate(shop, "g1");
    expect(copy).toEqual({
      ...guide,
      id: "new-guide-id",
      status: "draft",
      row_version: 1,
      created_at: "2026-02-09T12:00:00.000Z",
      updated_at: "2026-02-09T12:00:00.000Z",
    });
  });

  it("duplicate throws when guide is missing", async () => {
    const readFile = jest.fn().mockResolvedValue("[]");
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("ulid", () => ({ ulid: () => "new-guide-id" }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2026-02-09T12:00:00.000Z" }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.duplicate(shop, "missing")).rejects.toThrow(
      "Guide missing not found in demo",
    );
  });

  it("returns null when content file is missing", async () => {
    const readFile = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.getContent(shop, guide.key, "en")).resolves.toBeNull();
  });

  it("reads content from split content store", async () => {
    const content = { seo: { title: "Title", description: "Description" } };
    const readFile = jest.fn().mockResolvedValue(JSON.stringify(content));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.getContent(shop, guide.key, "en")).resolves.toEqual(content);
  });

  it("validates and writes content atomically with lastUpdated stamp", async () => {
    const readFile = jest.fn();
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2026-02-09T13:00:00.000Z" }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await jsonGuidesRepository.writeContent(shop, guide.key, "en", {
      seo: { title: "Title", description: "Description" },
    });

    const tmpPath = String(writeFile.mock.calls[0]?.[0]);
    const finalPath = "/tmp/data/demo/guides/content/positanoGuide/en.json";
    const payload = JSON.parse(writeFile.mock.calls[0]?.[1] as string);
    expect(payload.lastUpdated).toBe("2026-02-09T13:00:00.000Z");
    expect(tmpPath).toContain(`${finalPath}.`);
    expect(tmpPath).toContain(".tmp");
    expect(rename).toHaveBeenCalledWith(tmpPath, finalPath);
    expect(mkdir).toHaveBeenCalledWith("/tmp/data/demo/guides/content/positanoGuide", { recursive: true });
  });

  it("rejects invalid content payloads", async () => {
    const readFile = jest.fn();
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2026-02-09T13:00:00.000Z" }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(
      jsonGuidesRepository.writeContent(shop, guide.key, "en", {
        seo: { description: "Missing title" },
      } as never),
    ).rejects.toBeTruthy();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects invalid shop names", async () => {
    const readFile = jest.fn();
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));

    const { jsonGuidesRepository } = await import("../guides.json.server");
    await expect(jsonGuidesRepository.read("../evil")).rejects.toThrow("Invalid shop name");
    await expect(
      jsonGuidesRepository.writeContent("../evil", guide.key, "en", {
        seo: { title: "Title", description: "Description" },
      }),
    ).rejects.toThrow("Invalid shop name");
  });
});
