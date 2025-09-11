// packages/platform-core/__tests__/products.repoResolver.test.ts
import type { ProductsRepository } from "../src/repositories/products.types";

const jsonRepo: ProductsRepository = {
  read: jest.fn(),
  write: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  duplicate: jest.fn(),
};

const defaultRepo: ProductsRepository = {
  read: jest.fn(),
  write: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  duplicate: jest.fn(),
};

jest.mock("../src/repositories/repoResolver", () => ({
  resolveRepo: jest.fn(async () => {
    return process.env.PRODUCTS_BACKEND === "json" ? jsonRepo : defaultRepo;
  }),
}));

describe("products repository resolver", () => {
  const originalBackend = process.env.PRODUCTS_BACKEND;

  afterEach(() => {
    if (originalBackend === undefined) {
      delete process.env.PRODUCTS_BACKEND;
    } else {
      process.env.PRODUCTS_BACKEND = originalBackend;
    }
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function invokeAll() {
    const {
      readRepo,
      writeRepo,
      getProductById,
      updateProductInRepo,
      deleteProductFromRepo,
      duplicateProductInRepo,
    } = await import("../src/repositories/products.server");

    await readRepo("shop");
    await writeRepo("shop", []);
    await getProductById("shop", "id");
    await updateProductInRepo("shop", { id: "id", row_version: 1 });
    await deleteProductFromRepo("shop", "id");
    await duplicateProductInRepo("shop", "id");
  }

  it('uses json backend when PRODUCTS_BACKEND="json"', async () => {
    process.env.PRODUCTS_BACKEND = "json";
    await invokeAll();

    expect(jsonRepo.read).toHaveBeenCalledWith("shop");
    expect(jsonRepo.write).toHaveBeenCalledWith("shop", []);
    expect(jsonRepo.getById).toHaveBeenCalledWith("shop", "id");
    expect(jsonRepo.update).toHaveBeenCalledWith("shop", { id: "id", row_version: 1 });
    expect(jsonRepo.delete).toHaveBeenCalledWith("shop", "id");
    expect(jsonRepo.duplicate).toHaveBeenCalledWith("shop", "id");

    expect(defaultRepo.read).not.toHaveBeenCalled();
  });

  it("uses default backend when PRODUCTS_BACKEND is not set", async () => {
    delete process.env.PRODUCTS_BACKEND;
    await invokeAll();

    expect(defaultRepo.read).toHaveBeenCalledWith("shop");
    expect(defaultRepo.write).toHaveBeenCalledWith("shop", []);
    expect(defaultRepo.getById).toHaveBeenCalledWith("shop", "id");
    expect(defaultRepo.update).toHaveBeenCalledWith("shop", { id: "id", row_version: 1 });
    expect(defaultRepo.delete).toHaveBeenCalledWith("shop", "id");
    expect(defaultRepo.duplicate).toHaveBeenCalledWith("shop", "id");

    expect(jsonRepo.read).not.toHaveBeenCalled();
  });
});

