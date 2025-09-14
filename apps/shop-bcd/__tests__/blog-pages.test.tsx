// apps/shop-bcd/__tests__/blog-pages.test.tsx

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
});

describe("Blog post page", () => {
  test("renders post when found", async () => {
    jest.mock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn().mockResolvedValue({
        title: "Hello",
        slug: "hello",
        excerpt: "",
        body: [],
      }),
    }));
    jest.mock("@platform-core/components/blog/BlogPortableText", () => ({
      BlogPortableText: jest.fn(() => null),
    }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    await BlogPostPage({
      params: { lang: "en", slug: "hello" },
    } as any);
  });

  test("notFound when blog disabled", async () => {
    jest.doMock("../shop.json", () => ({
      id: "bcd",
      luxuryFeatures: { blog: false },
      editorialBlog: {},
    }));
    jest.mock("@acme/sanity", () => ({
      __esModule: true,
      fetchPostBySlug: jest.fn(),
    }));
    const notFound = jest.fn();
    jest.doMock("next/navigation", () => ({ notFound }));
    const { default: BlogPostPage } = await import(
      "../src/app/[lang]/blog/[slug]/page"
    );
    await BlogPostPage({ params: { lang: "en", slug: "x" } } as any);
    expect(notFound).toHaveBeenCalled();
  });

  test("notFound when post missing", async () => {
    jest.mock("@acme/sanity", () => ({
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
});
