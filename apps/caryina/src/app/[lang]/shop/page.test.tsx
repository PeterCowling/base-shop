import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import {
  getLaunchFamilyCopy,
  getSeoKeywords,
  getShopContent,
} from "@/lib/contentPacket";
import {
  buildCatalogCardMedia,
  filterSkusByLaunchFamily,
  getSkuFamilyLabel,
  resolveLaunchFamily,
} from "@/lib/launchMerchandising";
import { formatMoney, readShopCurrency, readShopInventory, readShopSkus } from "@/lib/shop";

import ShopPage, { generateMetadata } from "./page";

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

jest.mock("@/components/catalog/ProductMediaCard", () => ({
  ProductMediaCard: ({ title }: { title: string }) => (
    <div data-testid="product-media-card">{title}</div>
  ),
}));

jest.mock("@/components/typography/SectionEyebrow", () => ({
  SectionEyebrow: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock("@/lib/contentPacket", () => ({
  getLaunchFamilyCopy: jest.fn(),
  getSeoKeywords: jest.fn(),
  getShopContent: jest.fn(),
}));

jest.mock("@/lib/launchMerchandising", () => ({
  LAUNCH_FAMILY_ANCHORS: [
    { key: "top-handle", label: "Top Handle" },
    { key: "shoulder", label: "Shoulder" },
    { key: "mini", label: "Mini" },
  ],
  buildCatalogCardMedia: jest.fn(),
  filterSkusByLaunchFamily: jest.fn(),
  getSkuFamilyLabel: jest.fn(),
  resolveLaunchFamily: jest.fn(),
}));

jest.mock("@/lib/shop", () => ({
  formatMoney: jest.fn(),
  readShopCurrency: jest.fn(),
  readShopInventory: jest.fn(),
  readShopSkus: jest.fn(),
}));

jest.mock("./ShopAnalytics.client", () => ({
  __esModule: true,
  default: ({ locale }: { locale: string }) => <div data-testid="shop-analytics">{locale}</div>,
}));

const mockGetLaunchFamilyCopy = getLaunchFamilyCopy as jest.MockedFunction<typeof getLaunchFamilyCopy>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockGetShopContent = getShopContent as jest.MockedFunction<typeof getShopContent>;
const mockBuildCatalogCardMedia = buildCatalogCardMedia as jest.MockedFunction<typeof buildCatalogCardMedia>;
const mockFilterSkusByLaunchFamily = filterSkusByLaunchFamily as jest.MockedFunction<typeof filterSkusByLaunchFamily>;
const mockGetSkuFamilyLabel = getSkuFamilyLabel as jest.MockedFunction<typeof getSkuFamilyLabel>;
const mockResolveLaunchFamily = resolveLaunchFamily as jest.MockedFunction<typeof resolveLaunchFamily>;
const mockFormatMoney = formatMoney as jest.MockedFunction<typeof formatMoney>;
const mockReadShopCurrency = readShopCurrency as jest.MockedFunction<typeof readShopCurrency>;
const mockReadShopInventory = readShopInventory as jest.MockedFunction<typeof readShopInventory>;
const mockReadShopSkus = readShopSkus as jest.MockedFunction<typeof readShopSkus>;

const sku = {
  id: "sku_1",
  slug: "mini-1",
  title: "Mini One",
  price: 9900,
  stock: 5,
  media: [],
};

describe("ShopPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["shop", "caryina"]);
    mockGetShopContent.mockReturnValue({
      eyebrow: "Shop",
      heading: "Catalog",
      summary: "Browse all products",
      trustBullets: ["Bullet one", "Bullet two"],
    });
    mockGetLaunchFamilyCopy.mockReturnValue({
      "top-handle": { label: "Top Handle", description: "Structured" },
      shoulder: { label: "Shoulder", description: "Soft" },
      mini: { label: "Mini", description: "Small" },
    });
    mockBuildCatalogCardMedia.mockReturnValue({
      primarySrc: "/hero.jpg",
      primaryAlt: "Hero",
      secondarySrc: "/detail.jpg",
      secondaryAlt: "Detail",
    });
    mockGetSkuFamilyLabel.mockReturnValue("Mini");
    mockFormatMoney.mockReturnValue("€99.00");
    mockReadShopCurrency.mockResolvedValue("EUR");
    mockReadShopInventory.mockResolvedValue([]);
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "Catalog | Caryina",
      description: "Browse all products",
      keywords: ["shop", "caryina"],
    });
  });

  it("renders empty state when no products are available", async () => {
    mockResolveLaunchFamily.mockReturnValue(null);
    mockReadShopSkus.mockResolvedValue([]);
    mockFilterSkusByLaunchFamily.mockReturnValue([]);

    const ui = (await ShopPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("shop-analytics")).toHaveTextContent("en");
    expect(screen.getByText("No active products found yet.")).toBeInTheDocument();
  });

  it("shows unknown-family warning when filter is invalid", async () => {
    mockResolveLaunchFamily.mockReturnValue(null);
    mockReadShopSkus.mockResolvedValue([sku as never]);
    mockFilterSkusByLaunchFamily.mockReturnValue([sku as never]);

    const ui = (await ShopPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({ family: "invalid" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText("Unknown family filter. Showing all products.")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-media-card")).toHaveLength(1);
  });

  it("renders filtered-empty state when family has no products", async () => {
    mockResolveLaunchFamily.mockReturnValue("mini" as never);
    mockReadShopSkus.mockResolvedValue([sku as never]);
    mockFilterSkusByLaunchFamily.mockReturnValue([]);

    const ui = (await ShopPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({ family: "mini" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText("No products are currently assigned to this family.")).toBeInTheDocument();
    expect(screen.queryByTestId("product-media-card")).not.toBeInTheDocument();
  });
});
