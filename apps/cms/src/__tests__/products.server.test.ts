/* eslint-env jest */

// Minimal auth config
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-32-chars-long-string!";

jest.mock("../actions/common/auth", () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock("@platform-core/repositories/json.server", () => ({
  readRepo: jest.fn(),
  writeRepo: jest.fn(),
  readSettings: jest.fn(),
  updateProductInRepo: jest.fn(),
  getProductById: jest.fn(),
  duplicateProductInRepo: jest.fn(),
  deleteProductFromRepo: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("ulid", () => ({
  ulid: () => "draft-id",
}));

jest.mock("@/utils/sentry.server", () => ({
  captureException: jest.fn(),
}));
import {
  createDraft,
  updateProduct,
  duplicateProduct,
  deleteProduct,
} from "../actions/products.server";
import { ensureAuthorized } from "../actions/common/auth";
import { redirect } from "next/navigation";
import {
  readRepo,
  writeRepo,
  readSettings,
  updateProductInRepo,
  getProductById,
  duplicateProductInRepo,
  deleteProductFromRepo,
} from "@platform-core/repositories/json.server";
import { captureException } from "@/utils/sentry.server";

const ensureAuthorizedMock = ensureAuthorized as jest.Mock;
const redirectMock = redirect as jest.Mock;
const readRepoMock = readRepo as jest.Mock;
const writeRepoMock = writeRepo as jest.Mock;
const readSettingsMock = readSettings as jest.Mock;
const updateProductInRepoMock = updateProductInRepo as jest.Mock;
const getProductByIdMock = getProductById as jest.Mock;
const duplicateProductInRepoMock = duplicateProductInRepo as jest.Mock;
const deleteProductFromRepoMock = deleteProductFromRepo as jest.Mock;
const captureExceptionMock = captureException as jest.Mock;

describe("products server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readRepoMock.mockResolvedValue([]);
    writeRepoMock.mockResolvedValue(undefined);
    readSettingsMock.mockResolvedValue({ languages: ["en"] });
    updateProductInRepoMock.mockImplementation(async (_shop: string, prod: any) => prod);
    getProductByIdMock.mockResolvedValue({
      id: "p1",
      sku: "sku",
      title: { en: "old" },
      description: { en: "old" },
      price: 1,
      currency: "EUR",
      media: [],
      status: "draft",
      shop: "shop1",
      row_version: 1,
      created_at: "now",
      updated_at: "now",
    });
    duplicateProductInRepoMock.mockResolvedValue({ id: "copy" });
    deleteProductFromRepoMock.mockResolvedValue(undefined);
  });

  it("createDraft ensures authorization and redirects to edit page", async () => {
    await createDraft("shop1");
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/cms/shop/shop1/products/draft-id/edit"
    );
  });

  it("updateProduct returns validation errors and captures exception", async () => {
    const fd = new FormData();
    fd.append("id", "p1");
    fd.append("price", "5");
    fd.append("title_en", "");
    fd.append("desc_en", "desc");
    fd.append("media", "[]");

    const result = await updateProduct("shop1", fd);

    expect(result.errors).toBeDefined();
    expect(captureExceptionMock).toHaveBeenCalled();
  });

  it("updateProduct captures and rethrows repository errors", async () => {
    const error = new Error("repo failure");
    updateProductInRepoMock.mockRejectedValueOnce(error);

    const fd = new FormData();
    fd.append("id", "p1");
    fd.append("title_en", "new");
    fd.append("desc_en", "desc");
    fd.append("price", "5");
    fd.append("media", "[]");

    await expect(updateProduct("shop1", fd)).rejects.toThrow("repo failure");
    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      extra: { productId: "p1" },
    });
  });

  it("duplicateProduct ensures authorization and redirects", async () => {
    await duplicateProduct("shop1", "p1");
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/cms/shop/shop1/products/copy/edit"
    );
  });

  it("deleteProduct ensures authorization and redirects", async () => {
    await deleteProduct("shop1", "p1");
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(
      "/cms/shop/shop1/products"
    );
  });

  it("updateProduct defaults malformed media to []", async () => {
    const fd = new FormData();
    fd.append("id", "p1");
    fd.append("title_en", "new");
    fd.append("desc_en", "desc");
    fd.append("price", "5");
    fd.append("media", "not-json");

    const result = await updateProduct("shop1", fd);

    expect(result.product?.media).toEqual([]);
  });

  it("updateProduct saves valid data", async () => {
    const fd = new FormData();
    fd.append("id", "p1");
    fd.append("title_en", "new");
    fd.append("desc_en", "desc");
    fd.append("price", "5");
    fd.append(
      "media",
      JSON.stringify([{ url: "http://image", type: "image" }])
    );

    const result = await updateProduct("shop1", fd);

    expect(result.product).toBeDefined();
    expect(result.product?.title.en).toBe("new");
    expect(result.product?.price).toBe(5);
    expect(result.product?.media).toEqual([
      { url: "http://image", type: "image" },
    ]);
    expect(result.product?.row_version).toBe(2);
  });
});

