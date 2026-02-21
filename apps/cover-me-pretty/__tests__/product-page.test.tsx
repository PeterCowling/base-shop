// apps/cover-me-pretty/__tests__/product-page.test.tsx
import { render, screen } from "@testing-library/react";

import { LOCALES } from "@acme/i18n";

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Product detail page", () => {
  test("calls notFound when product missing", async () => {
    jest.doMock("@acme/platform-core/repositories/catalogSkus.server", () => ({
      getShopSkuBySlug: jest.fn().mockResolvedValue(null),
      listShopSkus: jest.fn().mockResolvedValue([]),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      getShopSettings: jest.fn().mockResolvedValue({ currency: "EUR" }),
    }));
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({ requireTags: false, allowWear: true }),
    }));
    jest.doMock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    jest.doMock("@acme/sanity", () => ({ fetchPublishedPosts: jest.fn().mockResolvedValue([]) }));
    jest.doMock("../src/app/util/seo", () => ({ getSeo: jest.fn().mockResolvedValue({}) }));
    jest.doMock("../src/lib/jsonld", () => ({
      JsonLdScript: () => null,
      productJsonLd: jest.fn().mockReturnValue({}),
    }));
    jest.doMock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("@acme/cms-ui/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    const { default: Page } = await import("../src/app/[lang]/product/[slug]/page");
    await Page({ params: { slug: "missing", lang: "en" } });
    expect(notFound).toHaveBeenCalled();
  });

  test("renders product with merchandising content", async () => {
    const product = {
      id: "p1",
      sku: "p1",
      slug: "p1",
      status: "active",
      title: "Prod",
      description: "Desc",
      price: 10,
      deposit: 5,
      availability: [],
      media: [],
      forSale: true,
      forRental: false,
    };
    jest.doMock("@acme/platform-core/repositories/catalogSkus.server", () => ({
      getShopSkuBySlug: jest.fn().mockResolvedValue(product),
      listShopSkus: jest.fn().mockResolvedValue([product]),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      getShopSettings: jest.fn().mockResolvedValue({ currency: "EUR", languages: ["en"] }),
    }));
    jest.doMock("@acme/sanity", () => ({
      fetchPublishedPosts: jest.fn().mockResolvedValue([
        { title: "Blog", excerpt: "Ex", slug: "b1", products: ["p1"] },
      ]),
    }));
    const BlogListing = jest.fn(() => null);
    jest.doMock("@acme/cms-ui/blocks/BlogListing", () => ({
      __esModule: true,
      default: BlogListing,
    }));
    const PdpClient = jest.fn(() => null);
    jest.doMock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: PdpClient,
    }));
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({ requireTags: true, allowWear: false }),
    }));
    jest.doMock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    jest.doMock("next/navigation", () => ({ notFound: jest.fn() }));
    jest.doMock("../shop.json", () => ({
      id: "cover-me-pretty",
      luxuryFeatures: { contentMerchandising: true, blog: true },
      editorialBlog: {},
    }));
    jest.doMock("../src/app/util/seo", () => ({ getSeo: jest.fn().mockResolvedValue({}) }));
    jest.doMock("../src/lib/jsonld", () => ({
      JsonLdScript: () => null,
      productJsonLd: jest.fn().mockReturnValue({}),
    }));
    const { default: Page } = await import("../src/app/[lang]/product/[slug]/page");
    const element = await Page({ params: { slug: "p1", lang: "en" } });
    render(element);
    expect(BlogListing).toHaveBeenCalled();
    expect(BlogListing.mock.calls[0][0]).toEqual({
      posts: [
        {
          title: "Blog",
          excerpt: "Ex",
          url: "/en/blog/b1",
          shopUrl: "/en/product/p1",
        },
      ],
    });
    expect(PdpClient).toHaveBeenCalled();
    expect(
      screen.getByText("Items must have all tags attached for return.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Items showing signs of wear may be rejected.")
    ).toBeInTheDocument();
  });
});

describe("page helpers", () => {
  test("generateMetadata returns product title", async () => {
    jest.doMock("@acme/platform-core/repositories/catalogSkus.server", () => ({
      getShopSkuBySlug: jest.fn().mockResolvedValue({
        id: "p1", sku: "p1", slug: "p1", status: "active",
        title: "Prod", description: "", price: 0, deposit: 0, media: [],
      }),
      listShopSkus: jest.fn().mockResolvedValue([]),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      getShopSettings: jest.fn().mockResolvedValue({ currency: "EUR", languages: ["en"] }),
    }));
    jest.doMock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    jest.doMock("next/navigation", () => ({ notFound: jest.fn() }));
    jest.doMock("../src/app/util/seo", () => ({
      getSeo: jest.fn().mockImplementation((_lang: string, opts?: { title?: string }) => opts ?? {}),
    }));
    jest.doMock("../src/lib/jsonld", () => ({
      JsonLdScript: () => null,
      productJsonLd: jest.fn().mockReturnValue({}),
    }));
    jest.doMock("@acme/cms-ui/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("@acme/sanity", () => ({ fetchPublishedPosts: jest.fn().mockResolvedValue([]) }));
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({}),
    }));
    const { generateMetadata } = await import("../src/app/[lang]/product/[slug]/page");
    const meta = await generateMetadata({ params: { slug: "p1", lang: "en" } });
    expect(meta.title).toBe("Prod");
  });

  test("generateMetadata returns fallback when product missing", async () => {
    jest.doMock("@acme/platform-core/repositories/catalogSkus.server", () => ({
      getShopSkuBySlug: jest.fn().mockResolvedValue(null),
      listShopSkus: jest.fn().mockResolvedValue([]),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      getShopSettings: jest.fn().mockResolvedValue({ currency: "EUR" }),
    }));
    jest.doMock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    jest.doMock("next/navigation", () => ({ notFound: jest.fn() }));
    jest.doMock("../src/app/util/seo", () => ({ getSeo: jest.fn().mockResolvedValue({}) }));
    jest.doMock("../src/lib/jsonld", () => ({
      JsonLdScript: () => null,
      productJsonLd: jest.fn().mockReturnValue({}),
    }));
    jest.doMock("@acme/cms-ui/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("@acme/sanity", () => ({ fetchPublishedPosts: jest.fn().mockResolvedValue([]) }));
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({}),
    }));
    const { generateMetadata } = await import("../src/app/[lang]/product/[slug]/page");
    const meta = await generateMetadata({ params: { slug: "x", lang: "en" } });
    expect(meta.title).toBe("Product not found");
  });

  test("generateStaticParams provides locale slugs", async () => {
    jest.doMock("@acme/platform-core/repositories/catalogSkus.server", () => ({
      getShopSkuBySlug: jest.fn().mockResolvedValue(null),
      listShopSkus: jest.fn().mockResolvedValue([
        { slug: "green-sneaker" },
        { slug: "sand-sneaker" },
        { slug: "black-sneaker" },
      ]),
    }));
    jest.doMock("@acme/platform-core/repositories/settings.server", () => ({
      getShopSettings: jest.fn().mockResolvedValue({}),
    }));
    jest.doMock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    jest.doMock("next/navigation", () => ({ notFound: jest.fn() }));
    jest.doMock("../src/app/util/seo", () => ({ getSeo: jest.fn().mockResolvedValue({}) }));
    jest.doMock("../src/lib/jsonld", () => ({
      JsonLdScript: () => null,
      productJsonLd: jest.fn().mockReturnValue({}),
    }));
    jest.doMock("@acme/cms-ui/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.doMock("@acme/sanity", () => ({ fetchPublishedPosts: jest.fn().mockResolvedValue([]) }));
    jest.doMock("@acme/platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({}),
    }));
    const { generateStaticParams } = await import("../src/app/[lang]/product/[slug]/page");
    expect(await generateStaticParams()).toEqual(
      LOCALES.flatMap((lang) =>
        ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({ lang, slug }))
      )
    );
  });
});
