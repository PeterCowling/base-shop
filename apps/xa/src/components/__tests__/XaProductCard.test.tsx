import * as React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { XaProductCard } from "../XaProductCard";
import type { XaProduct } from "../../lib/demoData";
import { getAvailableStock } from "../../lib/inventoryStore";

const dispatchMock = jest.fn().mockResolvedValue(undefined);
const wishlistDispatchMock = jest.fn();
let cartState: Record<string, unknown> = {};
let wishlistState: string[] = [];

jest.mock("../../contexts/XaCartContext", () => ({
  useCart: () => [cartState, dispatchMock],
}));

jest.mock("../../contexts/XaWishlistContext", () => ({
  useWishlist: () => [wishlistState, wishlistDispatchMock],
}));

jest.mock("../../lib/inventoryStore", () => ({
  getAvailableStock: jest.fn(),
}));


jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, ...props }: { fill?: boolean } & Record<string, unknown>) => (
    <img alt="" {...props} />
  ),
}));

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
      { url: "https://example.com/img-2.jpg", type: "image", altText: "Image 2" },
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
  dispatchMock.mockClear();
  wishlistDispatchMock.mockClear();
  (getAvailableStock as jest.Mock).mockReturnValue(3);
});

describe("XaProductCard", () => {
  it("renders fallback content and sold out badge", () => {
    (getAvailableStock as jest.Mock).mockReturnValue(0);
    const product = makeProduct({ media: [], sizes: [] });
    render(<XaProductCard product={product} />);

    expect(screen.getByText(product.title)).toBeInTheDocument();
  });

  it("shows discount badge and wishlist state", () => {
    const product = makeProduct({ compareAtPrice: 200 });
    wishlistState = [product.id];

    render(<XaProductCard product={product} />);

    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders quick add for clothing sizes", () => {
    const product = makeProduct({ sizes: ["S", "M"] });
    render(<XaProductCard product={product} />);

    expect(screen.getByText("Quick add")).toBeInTheDocument();
  });

  it("renders jewelry details when present", () => {
    const product = makeProduct({
      taxonomy: {
        category: "jewelry",
        department: "women",
        subcategory: "rings",
        color: ["gold"],
        material: ["gold"],
        metal: "rose-gold",
        gemstone: "emerald",
      },
    });
    render(<XaProductCard product={product} />);

    expect(screen.getByText("Rose Gold / Emerald")).toBeInTheDocument();
  });

  it("renders bag size class when provided", () => {
    const product = makeProduct({
      taxonomy: {
        category: "bags",
        department: "women",
        subcategory: "tote",
        color: ["black"],
        material: ["leather"],
        sizeClass: "mini",
      },
    });
    render(<XaProductCard product={product} />);

    expect(screen.getByText("Size class: Mini")).toBeInTheDocument();
  });
});
