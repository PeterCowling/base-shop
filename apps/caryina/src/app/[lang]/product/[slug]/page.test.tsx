import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import {
  readShopCurrency,
  readShopInventory,
  readShopSkuBySlug,
  readShopSkus,
} from "@/lib/shop";

import ProductDetailPage from "./page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

jest.mock("@/lib/shop", () => ({
  readShopSkuBySlug: jest.fn(),
  readShopCurrency: jest.fn(),
  readShopInventory: jest.fn(),
  readShopSkus: jest.fn(),
  formatMoney: jest.fn(() => "€89.00"),
}));

jest.mock("@/lib/contentPacket", () => ({
  getLaunchFamilyCopy: jest.fn(() => ({
    "top-handle": { label: "Top-handle", description: "Top-handle family" },
    shoulder: { label: "Shoulder", description: "Shoulder family" },
    mini: { label: "Mini", description: "Mini family" },
  })),
  getPolicyContent: jest.fn(() => ({ summary: "Policy summary" })),
  getProductPageContent: jest.fn(() => ({
    proofHeading: "Proof",
    proofBullets: ["Proof bullet"],
    relatedHeading: "Related products",
  })),
  getSeoKeywords: jest.fn(() => ["caryina", "bag" ]),
  getTrustStripContent: jest.fn(() => ({ exchange: "30-day exchange" })),
}));

jest.mock("@/lib/launchMerchandising", () => ({
  buildCatalogCardMedia: jest.fn(() => ({
    primarySrc: "/hero.jpg",
    primaryAlt: "Hero",
    secondarySrc: "/detail.jpg",
    secondaryAlt: "Detail",
  })),
  buildProductGalleryItems: jest.fn(() => [
    {
      id: "hero",
      role: "hero",
      roleLabel: "Hero",
      src: "/hero.jpg",
      type: "image",
      alt: "Hero image",
      isFallback: false,
    },
  ]),
  getSkuFamilyLabel: jest.fn(() => "Mini"),
}));

jest.mock("@/components/catalog/ProductGallery.client", () => ({
  ProductGallery: () => <div data-cy="product-gallery" />,
}));

jest.mock("@/components/catalog/ProductMediaCard", () => ({
  ProductMediaCard: () => <div data-cy="product-media-card" />,
}));

jest.mock("@/components/catalog/StockBadge", () => ({
  StockBadge: () => <div data-cy="stock-badge" />,
}));

jest.mock("@/components/ShippingReturnsTrustBlock", () => ({
  __esModule: true,
  default: () => <div data-cy="shipping-returns-block" />,
}));

jest.mock("@/components/catalog/NotifyMeForm.client", () => ({
  NotifyMeForm: () => <div data-cy="notify-me-form" />,
}));

jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: () => <button type="button">Add to cart</button>,
}));

jest.mock("./PdpTrustStrip", () => ({
  PdpTrustStrip: () => <div data-cy="pdp-trust-strip" />,
}));

jest.mock("./ProductAnalytics.client", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./StickyCheckoutBar.client", () => ({
  StickyCheckoutBar: () => <div data-cy="sticky-checkout-bar" />,
}));

const mockReadShopSkuBySlug = readShopSkuBySlug as jest.MockedFunction<typeof readShopSkuBySlug>;
const mockReadShopCurrency = readShopCurrency as jest.MockedFunction<typeof readShopCurrency>;
const mockReadShopInventory = readShopInventory as jest.MockedFunction<typeof readShopInventory>;
const mockReadShopSkus = readShopSkus as jest.MockedFunction<typeof readShopSkus>;

const baseProduct = {
  id: "sku-1",
  slug: "caryina-mini",
  title: "Caryina Mini",
  description: "Signature mini bag charm",
  price: 8900,
  deposit: 0,
  stock: 5,
  forSale: true,
  forRental: false,
  media: [],
  sizes: [],
};

describe("ProductDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadShopCurrency.mockResolvedValue("EUR");
    mockReadShopInventory.mockResolvedValue([
      {
        sku: "caryina-mini",
        productId: "sku-1",
        quantity: 5,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
    ]);
  });

  it("renders material details section when materials, dimensions, and weight are present", async () => {
    const productWithSpecs = {
      ...baseProduct,
      materials: { en: "Leather exterior" },
      dimensions: { h: 120, w: 180, d: 40, unit: "mm" },
      weight: { value: 240, unit: "g" },
    };

    mockReadShopSkuBySlug.mockResolvedValue(productWithSpecs as never);
    mockReadShopSkus.mockResolvedValue([
      productWithSpecs as never,
      { ...baseProduct, id: "sku-2", slug: "caryina-mini-2" } as never,
    ]);

    const ui = (await ProductDetailPage({
      params: Promise.resolve({ lang: "en", slug: "caryina-mini" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByLabelText("Material details")).toBeInTheDocument();
    expect(screen.getByText("Leather exterior")).toBeInTheDocument();
    expect(screen.getByText("240\u2009g")).toBeInTheDocument();
  });

  it("hides material details section when any spec field is missing", async () => {
    const productWithoutWeight = {
      ...baseProduct,
      materials: { en: "Leather exterior" },
      dimensions: { h: 120, w: 180, d: 40, unit: "mm" },
    };

    mockReadShopSkuBySlug.mockResolvedValue(productWithoutWeight as never);
    mockReadShopSkus.mockResolvedValue([productWithoutWeight as never]);

    const ui = (await ProductDetailPage({
      params: Promise.resolve({ lang: "en", slug: "caryina-mini" }),
    })) as ReactElement;

    render(ui);

    expect(screen.queryByLabelText("Material details")).not.toBeInTheDocument();
  });

  it("calls notFound when product lookup returns null", async () => {
    mockReadShopSkuBySlug.mockResolvedValue(null);
    mockReadShopSkus.mockResolvedValue([]);

    await expect(
      ProductDetailPage({
        params: Promise.resolve({ lang: "en", slug: "missing-product" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
