import { jest } from "@jest/globals";

describe("jsonProductsRepository", () => {
  const shop = "demo";

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    process.env.DATA_ROOT = "/tmp/data";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("duplicates product with fresh id, sku suffix, draft status and timestamps", async () => {
    const product = {
      id: "1",
      sku: "bcd",
      status: "published",
      row_version: 3,
      created_at: "old",
      updated_at: "old",
    };
    const readFile = (jest.fn() as any).mockResolvedValue(JSON.stringify([product]));
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("ulid", () => ({ ulid: () => "new-id" }));
    const { jsonProductsRepository } = await import("../products.json.server");

    const copy = await jsonProductsRepository.duplicate(shop, "1");

    expect(copy).toEqual({
      ...product,
      id: "new-id",
      sku: "bcd-copy",
      status: "draft",
      row_version: 1,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
    });

    const written = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(written[0]).toEqual(copy);
    expect(written[1]).toEqual(product);
    expect(mkdir).toHaveBeenCalledWith("/tmp/data/demo", { recursive: true });
  });

  it("throws when original product is missing", async () => {
    const readFile = (jest.fn() as any).mockResolvedValue("[]");
    const writeFile = jest.fn();
    const rename = jest.fn();
    const mkdir = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, rename, mkdir } }));
    jest.doMock("ulid", () => ({ ulid: () => "new-id" }));
    const { jsonProductsRepository } = await import("../products.json.server");

    await expect(jsonProductsRepository.duplicate(shop, "1")).rejects.toThrow(
      "Product 1 not found in demo",
    );
    expect(writeFile).not.toHaveBeenCalled();
  });
});
