import { jest } from "@jest/globals";

describe("products repository", () => {
  const shop = "demo";

  beforeEach(() => {
    jest.resetModules();
    process.env.DATA_ROOT = "/tmp/data";
  });

  it("readRepo returns empty array when products file is missing", async () => {
    const readFile = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    jest.doMock("fs", () => ({ promises: { readFile } }));
    const { readRepo } = await import("../products.server");
    await expect(readRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalled();
  });

  it("readRepo returns empty array on JSON parse error", async () => {
    const readFile = jest.fn().mockResolvedValue("not json");
    jest.doMock("fs", () => ({ promises: { readFile } }));
    const { readRepo } = await import("../products.server");
    await expect(readRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalled();
  });

  it("readRepo returns empty array when fs.readFile fails", async () => {
    const readFile = jest.fn().mockRejectedValue(new Error("EACCES"));
    jest.doMock("fs", () => ({ promises: { readFile } }));
    const { readRepo } = await import("../products.server");
    await expect(readRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalled();
  });

  it("writeRepo writes catalogue to temp file then renames", async () => {
    const mkdir = jest.fn();
    const writeFile = jest.fn();
    const rename = jest.fn();
    jest.doMock("fs", () => ({ promises: { mkdir, writeFile, rename } }));
    const now = 123456;
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const { writeRepo } = await import("../products.server");
    await writeRepo(shop, [{ id: "1" }]);
    const file = "/tmp/data/demo/products.json";
    const tmp = `${file}.${now}.tmp`;
    expect(mkdir).toHaveBeenCalledWith("/tmp/data/demo", { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      tmp,
      JSON.stringify([{ id: "1" }], null, 2),
      "utf8",
    );
    expect(rename).toHaveBeenCalledWith(tmp, file);
    nowSpy.mockRestore();
  });

  describe("getProductById", () => {
    it("returns product when found", async () => {
      const readFile = jest
        .fn()
        .mockResolvedValue('[{"id":"1","row_version":1}]');
      jest.doMock("fs", () => ({ promises: { readFile } }));
      const { getProductById } = await import("../products.server");
      await expect(getProductById(shop, "1")).resolves.toEqual({
        id: "1",
        row_version: 1,
      });
    });

    it("returns null when product is missing", async () => {
      const readFile = jest.fn().mockResolvedValue("[]");
      jest.doMock("fs", () => ({ promises: { readFile } }));
      const { getProductById } = await import("../products.server");
      await expect(getProductById(shop, "2")).resolves.toBeNull();
    });
  });

  describe("updateProductInRepo", () => {
    it("updates product and increments row_version", async () => {
      const readFile = jest
        .fn()
        .mockResolvedValue('[{"id":"1","row_version":1,"name":"old"}]');
      const writeFile = jest.fn();
      const mkdir = jest.fn();
      const rename = jest.fn();
      jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
      const { updateProductInRepo } = await import("../products.server");
      const result = await updateProductInRepo(shop, { id: "1", name: "new" });
      expect(result).toEqual({ id: "1", row_version: 2, name: "new" });
      const written = JSON.parse(writeFile.mock.calls[0][1]);
      expect(written[0]).toEqual(result);
      expect(readFile).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
    });

    it("throws when id not found", async () => {
      const readFile = jest.fn().mockResolvedValue("[]");
      const writeFile = jest.fn();
      const mkdir = jest.fn();
      const rename = jest.fn();
      jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
      const { updateProductInRepo } = await import("../products.server");
      await expect(updateProductInRepo(shop, { id: "2" })).rejects.toThrow(
        "Product 2 not found in demo",
      );
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  it("deleteProductFromRepo throws when product absent", async () => {
    const readFile = jest.fn().mockResolvedValue('[{"id":"1"}]');
    const writeFile = jest.fn();
    const mkdir = jest.fn();
    const rename = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
    const { deleteProductFromRepo } = await import("../products.server");
    await expect(deleteProductFromRepo(shop, "2")).rejects.toThrow(
      "Product 2 not found in demo",
    );
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("deleteProductFromRepo removes product when present", async () => {
    const readFile = jest.fn().mockResolvedValue('[{"id":"1"},{"id":"2"}]');
    const writeFile = jest.fn();
    const mkdir = jest.fn();
    const rename = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
    const { deleteProductFromRepo } = await import("../products.server");
    await expect(deleteProductFromRepo(shop, "1")).resolves.toBeUndefined();
    const written = JSON.parse(writeFile.mock.calls[0][1]);
    expect(written).toEqual([{ id: "2" }]);
  });

  describe("duplicateProductInRepo", () => {
    it("duplicates product with new id and sku", async () => {
      const product = {
        id: "1",
        sku: "bcd",
        row_version: 3,
        status: "published",
        created_at: "old",
        updated_at: "old",
      };
      const readFile = jest.fn().mockResolvedValue(JSON.stringify([product]));
      const writeFile = jest.fn();
      const mkdir = jest.fn();
      const rename = jest.fn();
      jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
      jest.doMock("ulid", () => ({ ulid: () => "new-id" }));
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2020-01-01T00:00:00Z" }));
      const { duplicateProductInRepo } = await import("../products.server");
      const copy = await duplicateProductInRepo(shop, "1");
      expect(copy).toMatchObject({
        id: "new-id",
        sku: "bcd-copy",
        status: "draft",
        row_version: 1,
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
      });
      const written = JSON.parse(writeFile.mock.calls[0][1]);
      expect(written[0]).toEqual(copy);
      expect(written[1]).toEqual(product);
    });

    it("throws when original missing", async () => {
      const readFile = jest.fn().mockResolvedValue("[]");
      const writeFile = jest.fn();
      const mkdir = jest.fn();
      const rename = jest.fn();
      jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
      const { duplicateProductInRepo } = await import("../products.server");
      await expect(duplicateProductInRepo(shop, "1")).rejects.toThrow(
        "Product 1 not found in demo",
      );
      expect(writeFile).not.toHaveBeenCalled();
    });
  });
});

