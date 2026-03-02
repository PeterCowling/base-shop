import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import { getProductById } from "@acme/platform-core/repositories/products.server";

import AdminProductEditPage from "./page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  readInventory: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  getProductById: jest.fn(),
}));

jest.mock("@/components/admin/ProductForm.client", () => ({
  ProductForm: ({ product }: { product?: { id: string } }) => (
    <div data-cy="product-form">{product ? `product:${product.id}` : "product:new"}</div>
  ),
}));

jest.mock("@/components/admin/InventoryEditor.client", () => ({
  InventoryEditor: ({
    productSku,
    inventoryItems,
  }: {
    productSku: string;
    inventoryItems: unknown[];
  }) => (
    <div data-cy="inventory-editor">{`${productSku}:${inventoryItems.length}`}</div>
  ),
}));

const mockGetProductById = getProductById as jest.MockedFunction<typeof getProductById>;
const mockReadInventory = readInventory as jest.MockedFunction<typeof readInventory>;

describe("AdminProductEditPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadInventory.mockResolvedValue([] as never);
  });

  it("calls notFound when product cannot be found", async () => {
    mockGetProductById.mockResolvedValue(null);

    await expect(
      AdminProductEditPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders edit page with product and inventory editor", async () => {
    mockGetProductById.mockResolvedValue({
      id: "p_1",
      title: { en: "Caryina Mini" },
      sku: "CARY-MINI-001",
      price: 12900,
      status: "active",
    } as never);
    mockReadInventory.mockResolvedValue([
      {
        sku: "CARY-MINI-001",
        quantity: 8,
      },
    ] as never);

    const ui = (await AdminProductEditPage({
      params: Promise.resolve({ id: "p_1" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "Caryina Mini" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Products" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
    expect(screen.getByTestId("product-form")).toHaveTextContent("product:p_1");
    expect(screen.getByTestId("inventory-editor")).toHaveTextContent("CARY-MINI-001:1");
  });
});
