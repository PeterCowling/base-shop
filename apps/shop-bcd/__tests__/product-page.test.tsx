// apps/shop-bcd/__tests__/product-page.test.tsx
import { render, screen } from "@testing-library/react";
import { LOCALES } from "@acme/i18n";

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("Product detail page", () => {
  test("calls notFound when product missing", async () => {
    jest.mock("@platform-core/repositories/json.server", () => ({
      readRepo: jest.fn().mockResolvedValue([]),
    }));
    jest.mock("@platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({ requireTags: false, allowWear: true }),
    }));
    jest.mock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: Page } = await import("../src/app/[lang]/product/[slug]/page");
    await Page({ params: { slug: "missing", lang: "en" } });
    expect(notFound).toHaveBeenCalled();
  });

  test("renders product with merchandising content", async () => {
    jest.mock("@platform-core/repositories/json.server", () => ({
      readRepo: jest.fn().mockResolvedValue([
        {
          id: "p1",
          sku: "p1",
          status: "active",
          title: { en: "Prod" },
          description: { en: "Desc" },
          price: 10,
          deposit: 5,
          availability: [],
          media: [],
          forSale: true,
          forRental: false,
        },
      ]),
    }));
    jest.mock("@acme/sanity", () => ({
      fetchPublishedPosts: jest.fn().mockResolvedValue([
        { title: "Blog", excerpt: "Ex", slug: "b1", products: ["p1"] },
      ]),
    }));
    jest.mock("@ui/components/cms/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.mock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.mock("@platform-core/returnLogistics", () => ({
      getReturnLogistics: jest.fn().mockResolvedValue({ requireTags: true, allowWear: false }),
    }));
    jest.mock("next/headers", () => ({ draftMode: jest.fn().mockResolvedValue({ isEnabled: false }) }));
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { contentMerchandising: true, blog: true },
      editorialBlog: {},
    }));
    const { default: Page } = await import("../src/app/[lang]/product/[slug]/page");
    const element = await Page({ params: { slug: "p1", lang: "en" } });
    render(element);
    const BlogListing = (await import("@ui/components/cms/blocks/BlogListing")).default as jest.Mock;
    const PdpClient = (await import("../src/app/[lang]/product/[slug]/PdpClient.client")).default as jest.Mock;
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
    // JSON-LD present
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });
});

describe("page helpers", () => {
  test("generateMetadata returns product title", async () => {
    jest.mock("@platform-core/repositories/json.server", () => ({
      readRepo: jest.fn().mockResolvedValue([
        { id: "p1", sku: "p1", status: "active", title: { en: "Prod" }, description: { en: "" }, price: 0, deposit: 0 },
      ]),
    }));
    const { generateMetadata } = await import("../src/app/[lang]/product/[slug]/page");
    const meta = await generateMetadata({ params: { slug: "p1", lang: "en" } });
    expect(meta.title).toBe("Prod");
  });

  test("generateMetadata returns fallback when product missing", async () => {
    jest.mock("@platform-core/repositories/json.server", () => ({
      readRepo: jest.fn().mockResolvedValue([]),
    }));
    const { generateMetadata } = await import("../src/app/[lang]/product/[slug]/page");
    const meta = await generateMetadata({ params: { slug: "x", lang: "en" } });
    expect(meta.title).toBe("Product not found");
  });

  test("generateStaticParams provides locale slugs", async () => {
    const { generateStaticParams } = await import("../src/app/[lang]/product/[slug]/page");
    expect(await generateStaticParams()).toEqual(
      LOCALES.flatMap((lang) =>
        ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({ lang, slug }))
      )
    );
  });
});
