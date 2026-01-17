/** @jest-environment node */
import path from "path";

const files = new Map<string, string>();
const readFile = jest.fn(async (p: string) => {
  const data = files.get(p);
  if (data === undefined) {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    throw err;
  }
  return data;
});
const writeFile = jest.fn(async (p: string, data: string) => {
  files.set(p, data);
});
const mkdir = jest.fn(async () => {});
const rename = jest.fn(async (a: string, b: string) => {
  const data = files.get(a) || "";
  files.set(b, data);
  files.delete(a);
});

jest.mock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));

describe("products repository", () => {
  const shop = "shop1";
  const file = path.join("/data", shop, "products.json");

  beforeEach(() => {
    files.clear();
    jest.resetModules();
    process.env.DATA_ROOT = "/data";
  });

  test("readRepo returns array and empty array when missing", async () => {
    const { readRepo } = await import("@acme/platform-core/repositories/products.server");
    files.set(file, JSON.stringify([{ id: "p1" }]));
    const list = await readRepo(shop);
    expect(list).toEqual([{ id: "p1" }]);
    files.delete(file);
    const empty = await readRepo(shop);
    expect(empty).toEqual([]);
  });

  test("updateProductInRepo updates record and increments version", async () => {
    const { updateProductInRepo } = await import("@acme/platform-core/repositories/products.server");
    files.set(file, JSON.stringify([{ id: "p1", row_version: 1 }]));
    const updated = await updateProductInRepo(shop, { id: "p1", title: "New" });
    expect(updated).toMatchObject({ id: "p1", title: "New", row_version: 2 });
    const written = JSON.parse(files.get(file)!);
    expect(written[0]).toMatchObject({ id: "p1", title: "New", row_version: 2 });
  });

  test("updateProductInRepo throws when product missing", async () => {
    const { updateProductInRepo } = await import("@acme/platform-core/repositories/products.server");
    files.set(file, JSON.stringify([{ id: "p1", row_version: 1 }]));
    await expect(updateProductInRepo(shop, { id: "p2" })).rejects.toThrow(
      "Product p2 not found"
    );
  });

  test("deleteProductFromRepo removes product and errors when missing", async () => {
    const { deleteProductFromRepo } = await import("@acme/platform-core/repositories/products.server");
    files.set(file, JSON.stringify([{ id: "p1", row_version: 1 }]));
    await deleteProductFromRepo(shop, "p1");
    expect(JSON.parse(files.get(file)!)).toEqual([]);
    await expect(deleteProductFromRepo(shop, "p2")).rejects.toThrow(
      "Product p2 not found"
    );
  });
});
