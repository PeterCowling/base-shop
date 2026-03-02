import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import {
  getHomeContent,
  getLaunchFamilyCopy,
  getSeoKeywords,
} from "@/lib/contentPacket";
import {
  buildCatalogCardMedia,
  buildLaunchFamilyAnchors,
  getSkuFamilyLabel,
} from "@/lib/launchMerchandising";
import { formatMoney, readShopCurrency, readShopSkus } from "@/lib/shop";

import LocaleHomePage, { generateMetadata } from "./page";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <div data-testid="next-image">{alt}</div>,
}));

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
  SectionEyebrow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section-eyebrow">{children}</div>
  ),
}));

jest.mock("@/lib/contentPacket", () => ({
  getHomeContent: jest.fn(),
  getLaunchFamilyCopy: jest.fn(),
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/lib/launchMerchandising", () => ({
  buildCatalogCardMedia: jest.fn(),
  buildLaunchFamilyAnchors: jest.fn(),
  getSkuFamilyLabel: jest.fn(),
}));

jest.mock("@/lib/shop", () => ({
  formatMoney: jest.fn(),
  readShopCurrency: jest.fn(),
  readShopSkus: jest.fn(),
}));

const mockGetHomeContent = getHomeContent as jest.MockedFunction<typeof getHomeContent>;
const mockGetLaunchFamilyCopy = getLaunchFamilyCopy as jest.MockedFunction<typeof getLaunchFamilyCopy>;
const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockBuildCatalogCardMedia = buildCatalogCardMedia as jest.MockedFunction<typeof buildCatalogCardMedia>;
const mockBuildLaunchFamilyAnchors = buildLaunchFamilyAnchors as jest.MockedFunction<typeof buildLaunchFamilyAnchors>;
const mockGetSkuFamilyLabel = getSkuFamilyLabel as jest.MockedFunction<typeof getSkuFamilyLabel>;
const mockFormatMoney = formatMoney as jest.MockedFunction<typeof formatMoney>;
const mockReadShopCurrency = readShopCurrency as jest.MockedFunction<typeof readShopCurrency>;
const mockReadShopSkus = readShopSkus as jest.MockedFunction<typeof readShopSkus>;

const mockHomeContent = {
  eyebrow: "Eyebrow",
  heading: "Home heading",
  summary: "Home summary",
  ctaPrimary: "Shop now",
  ctaSecondary: "Explore mini",
  seoHeading: "SEO heading",
  seoBody: "SEO body",
  faqHeading: "FAQ",
  faqItems: [
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
  ],
};

describe("LocaleHomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHomeContent.mockReturnValue(mockHomeContent);
    mockGetLaunchFamilyCopy.mockReturnValue({
      "top-handle": { label: "Top Handle", description: "Structured" },
      shoulder: { label: "Shoulder", description: "Soft" },
      mini: { label: "Mini", description: "Small" },
    });
    mockGetSeoKeywords.mockReturnValue(["home", "caryina"]);
    mockBuildCatalogCardMedia.mockReturnValue({
      primarySrc: "/hero.jpg",
      primaryAlt: "Hero media",
      secondarySrc: "/alt.jpg",
      secondaryAlt: "Alt media",
    });
    mockBuildLaunchFamilyAnchors.mockReturnValue([]);
    mockGetSkuFamilyLabel.mockReturnValue("Mini");
    mockFormatMoney.mockReturnValue("€99.00");
    mockReadShopCurrency.mockResolvedValue("EUR");
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });

    expect(metadata).toEqual({
      title: "Caryina | Home heading",
      description: "Home summary",
      keywords: ["home", "caryina"],
    });
  });

  it("renders empty featured-catalog state when there are no products", async () => {
    mockReadShopSkus.mockResolvedValue([]);

    const ui = (await LocaleHomePage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "Home heading" })).toBeInTheDocument();
    expect(screen.getByText("Catalog is empty. Add active products in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/en/shop");
  });

  it("renders featured products when SKUs are available", async () => {
    mockReadShopSkus.mockResolvedValue([
      {
        id: "sku_1",
        slug: "mini-1",
        title: "Mini One",
        price: 9900,
        media: [],
      },
      {
        id: "sku_2",
        slug: "mini-2",
        title: "Mini Two",
        price: 10900,
        media: [],
      },
    ] as never);
    mockBuildLaunchFamilyAnchors.mockReturnValue([
      {
        key: "mini",
        label: "Mini",
        description: "Small",
        href: "/en/shop?family=mini",
        productCount: 2,
        heroImageSrc: "/family.jpg",
      },
    ] as never);

    const ui = (await LocaleHomePage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getAllByTestId("product-media-card")).toHaveLength(2);
    expect(screen.getByText("Mini One")).toBeInTheDocument();
    expect(screen.getByText("Mini Two")).toBeInTheDocument();
  });
});
