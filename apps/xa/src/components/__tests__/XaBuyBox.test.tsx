import * as React from "react";
import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { XaProduct } from "../../lib/demoData";

const dispatchMock = jest.fn().mockResolvedValue(undefined);
const wishlistDispatchMock = jest.fn();
let cartState: Record<string, unknown> = {};
let wishlistState: string[] = [];
let mockProducts: XaProduct[] = [];
let XaBuyBox: typeof import("../XaBuyBox.client").XaBuyBox;
let getAvailableStock: jest.Mock;

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, ...rest } = overrides;
  return {
    id: "sku-1",
    slug: "sku-1",
    title: "Test Product",
    price: 150,
    deposit: 0,
    stock: 3,
    forSale: true,
    forRental: false,
    media: [
      { url: "https://example.com/img-1.jpg", type: "image", altText: "Image" },
    ],
    sizes: ["S", "M"],
    description: "desc",
    brand: "acme",
    collection: "core",
    createdAt: "2024-01-01T00:00:00Z",
    popularity: 1,
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "tops",
      color: ["black", "ivory"],
      material: ["cotton"],
      ...(taxonomy ?? {}),
    },
    ...rest,
  };
};

beforeEach(() => {
  cartState = {};
  wishlistState = [];
  mockProducts = [];
  dispatchMock.mockClear();
  wishlistDispatchMock.mockClear();
  (getAvailableStock as jest.Mock).mockReturnValue(3);
});

beforeAll(async () => {
  jest.doMock("../../contexts/XaCartContext", () => ({
    useCart: () => [cartState, dispatchMock],
  }));
  jest.doMock("../../contexts/XaWishlistContext", () => ({
    useWishlist: () => [wishlistState, wishlistDispatchMock],
  }));
  jest.doMock("@acme/platform-core/contexts/CurrencyContext", () => ({
    useCurrency: () => ["EUR", jest.fn()],
  }));
  jest.doMock("../../lib/demoData", () => ({
    get XA_PRODUCTS() {
      return mockProducts;
    },
  }));
  jest.doMock("../../lib/inventoryStore", () => ({
    getAvailableStock: jest.fn(),
  }));
  jest.doMock("next/link", () => ({
    __esModule: true,
    default: ({
      href,
      children,
      ...rest
    }: {
      href?: string;
      children: React.ReactNode;
    } & Record<string, unknown>) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  }));
  jest.doMock("next/image", () => ({
    __esModule: true,
    default: ({ fill, ...props }: { fill?: boolean } & Record<string, unknown>) => (
      <img alt="" {...props} />
    ),
  }));
  jest.doMock("../XaFadeImage", () => ({
    __esModule: true,
    XaFadeImage: ({ alt }: { alt?: string }) => <img alt={alt ?? ""} />,
  }));
  ({ XaBuyBox } = await import("../XaBuyBox.client"));
  ({ getAvailableStock } = await import("../../lib/inventoryStore"));
});

describe("XaBuyBox", () => {
  it("renders size selector and discount copy", () => {
    const product = makeProduct({ compareAtPrice: 200 });
    mockProducts.push(product);

    render(<XaBuyBox product={product} />);

    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("shows one-size note and sold out state", () => {
    (getAvailableStock as jest.Mock).mockReturnValue(0);
    const product = makeProduct({ sizes: ["OS"] });
    mockProducts.push(product);

    render(<XaBuyBox product={product} />);

    expect(screen.getByText("One Size available")).toBeInTheDocument();
    expect(screen.getByText("Out of stock.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add To Bag" })).toBeDisabled();
  });

  it("shows dispatch errors when add to cart fails", async () => {
    dispatchMock.mockRejectedValueOnce(new Error("Nope"));
    const product = makeProduct({ sizes: ["OS"] });
    mockProducts.push(product);

    render(<XaBuyBox product={product} />);

    fireEvent.click(screen.getByRole("button", { name: "Add To Bag" }));

    await waitFor(() => {
      expect(screen.getByText("Nope")).toBeInTheDocument();
    });
  });

  it("renders variant strip when variants exist", () => {
    const product = makeProduct({ id: "sku-1", slug: "sku-1", variantGroup: "group-1" });
    const sibling = makeProduct({
      id: "sku-2",
      slug: "sku-2",
      title: "Variant Two",
      variantGroup: "group-1",
      taxonomy: {
        department: "women",
        category: "clothing",
        subcategory: "tops",
        color: ["white"],
        material: ["cotton"],
      },
    });
    mockProducts.push(product, sibling);

    render(<XaBuyBox product={product} />);

    expect(screen.getByText("Also available in")).toBeInTheDocument();
    expect(screen.getByLabelText("Black")).toBeInTheDocument();
    expect(screen.getByLabelText("White")).toBeInTheDocument();
  });

  it("renders color strip when variants are missing", () => {
    const product = makeProduct({
      taxonomy: {
        department: "women",
        category: "clothing",
        subcategory: "tops",
        color: ["black", "ivory"],
        material: ["cotton"],
      },
      media: [],
    });
    mockProducts.push(product);

    render(<XaBuyBox product={product} />);

    expect(screen.getByText("Also available in")).toBeInTheDocument();
    expect(screen.getByTitle("Black")).toBeInTheDocument();
    expect(screen.getByTitle("Ivory")).toBeInTheDocument();
  });
});
