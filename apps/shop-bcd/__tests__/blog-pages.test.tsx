// apps/shop-bcd/__tests__/blog-pages.test.tsx
import { render, screen } from "@testing-library/react";

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("Blog listing page", () => {
  test("renders posts when blog enabled", async () => {
    jest.mock("@ui/components/cms/blocks/BlogListing", () => ({
      __esModule: true,
      default: jest.fn(() => null),
    }));
    jest.mock("@acme/sanity", () => ({
      __esModule: true,
      fetchPublishedPosts: jest
        .fn()
        .mockResolvedValue([
          { title: "Hello", slug: "hello", excerpt: "Hi", products: ["p1"] },
        ]),
    }));
    const { default: BlogPage } = await import(
      "../src/app/[lang]/blog/page"
    );
    const BlogListing = (
      await import("@ui/components/cms/blocks/BlogListing")
    ).default as jest.Mock;
    await BlogPage({ params: { lang: "en" } } as any);
    expect(BlogListing).toHaveBeenCalledWith(
      {
        posts: [
          {
            title: "Hello",
            excerpt: "Hi",
            url: "/en/blog/hello",
            shopUrl: "/en/product/p1",
          },
        ],
      },
      {},
    );
  });

  test("calls notFound when blog disabled", async () => {
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { blog: false },
      editorialBlog: {},
    }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: BlogPage } = await import(
      "../src/app/[lang]/blog/page"
    );
    await BlogPage({ params: { lang: "en" } } as any);
    expect(notFound).toHaveBeenCalled();
  });

  test("generateMetadata sets canonical and OG/Twitter", async () => {
    jest.doMock("../src/app/util/seo", () => ({
      __esModule: true,
      getSeo: jest.fn(async (_lang: string, page?: any) => ({
        title: page?.title ?? "Base",
        description: page?.description ?? "Desc",
        canonical: page?.canonical ?? "https://example.com/en",
        openGraph: { url: page?.openGraph?.url ?? "https://example.com/en" },
        twitter: { card: "summary" },
      })),
    }));
    const { generateMetadata } = await import("../src/app/[lang]/blog/page");
    const meta = await generateMetadata({ params: { lang: "en" } } as any);
    expect(meta.alternates?.canonical).toBe("https://example.com/en/blog");
    expect(meta.openGraph?.url).toBe("https://example.com/en/blog");
  });
});

describe("Blog post page", () => {
  test("renders post when found", async () => {
    const fetchPostBySlug = jest.fn().mockResolvedValue({
      title: "Hello",
      slug: "hello",
      excerpt: "",
      body: [],
    });
    jest.doMock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug,
    }));
    jest.doMock("@platform-core/components/blog/BlogPortableText", () => ({
      BlogPortableText: jest.fn(() => null),
    }));
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { blog: true },
      editorialBlog: {},
    }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    const res = await BlogPostPage({
      params: { lang: "en", slug: "hello" },
    } as any);
    expect(notFound).not.toHaveBeenCalled();
    render(res);
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });

  test("notFound when blog disabled", async () => {
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { blog: false },
      editorialBlog: {},
    }));
    jest.doMock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn(),
    }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    await BlogPostPage({ params: { lang: "en", slug: "x" } } as any);
    const { fetchPostBySlug } = await import("@acme/sanity");
    expect(fetchPostBySlug).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  test("notFound when post missing", async () => {
    jest.doMock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn().mockResolvedValue(null),
    }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    await BlogPostPage({ params: { lang: "en", slug: "missing" } } as any);
    expect(notFound).toHaveBeenCalled();
  });

  test("renders promote schedule when configured", async () => {
    jest.doMock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn().mockResolvedValue({
        title: "Hello",
        slug: "hello",
        excerpt: "",
        body: [],
      }),
    }));
    jest.doMock("@platform-core/components/blog/BlogPortableText", () => ({
      BlogPortableText: jest.fn(() => null),
    }));
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { blog: true },
      editorialBlog: { promoteSchedule: "2025-05-01" },
    }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    const element = await BlogPostPage({
      params: { lang: "en", slug: "hello" },
    } as any);
    render(element);
    expect(
      screen.getByText("Daily Edit scheduled for 2025-05-01")
    ).toBeInTheDocument();
  });

  test("generateMetadata derives from post", async () => {
    jest.doMock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn(async () => ({
        title: "Hello",
        slug: "hello",
        excerpt: "World",
      })),
    }));
    jest.doMock("../src/app/util/seo", () => ({
      __esModule: true,
      getSeo: jest.fn(async (_lang: string, page?: any) => ({
        title: page?.title ?? "Base",
        description: page?.description ?? "Desc",
        canonical: page?.canonical ?? "https://example.com/en",
        openGraph: { url: page?.openGraph?.url ?? "https://example.com/en" },
        twitter: { card: "summary" },
      })),
    }));
    const { generateMetadata } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    const meta = await generateMetadata({
      params: { lang: "en", slug: "hello" },
    } as any);
    expect(meta.title).toBe("Hello");
    expect(meta.description).toBe("World");
    expect(meta.alternates?.canonical).toBe(
      "https://example.com/en/blog/hello",
    );
  });
});
