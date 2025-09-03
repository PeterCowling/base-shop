import { jest } from "@jest/globals";

describe("products repository error cases", () => {
  const shop = "demo";

  beforeEach(() => {
    jest.resetModules();
    process.env.DATA_ROOT = "/tmp/data";
  });

  it("readRepo returns empty array when file read fails", async () => {
    const readFile = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("fs", () => ({ promises: { readFile } }));
    const { readRepo } = await import("../products.server");
    await expect(readRepo(shop)).resolves.toEqual([]);
    expect(readFile).toHaveBeenCalled();
  });

  it("updateProductInRepo throws when id not found", async () => {
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

  it("duplicateProductInRepo throws when original missing", async () => {
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
