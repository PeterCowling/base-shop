import { render, screen } from "@testing-library/react";
import ShopIndexPage from "./page";
import { fetchPublishedPosts } from "@acme/sanity";

jest.mock("@acme/sanity", () => ({
  fetchPublishedPosts: jest.fn(),
}));

const mockFetchPublishedPosts =
  fetchPublishedPosts as jest.MockedFunction<typeof fetchPublishedPosts>;

// Mock env.NEXT_PUBLIC_LUXURY_FEATURES
jest.mock("@acme/config/env/core", () => ({
  coreEnv: { NEXT_PUBLIC_LUXURY_FEATURES: "{}" },
}));
import { coreEnv as mockEnv } from "@acme/config/env/core";

// Mock BlogListing component
jest.mock("@ui/components/cms/blocks/BlogListing", () => ({
  __esModule: true,
  default: () => <div data-cy="blog-listing" />,
}));

// Mock ShopClient to avoid next/navigation hooks
jest.mock("./ShopClient.client", () => ({
  __esModule: true,
  default: () => <div data-cy="shop-client" />,
}));

describe("ShopIndexPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.NEXT_PUBLIC_LUXURY_FEATURES = "{}";
  });

  it("renders BlogListing when contentMerchandising and blog flags are true", async () => {
    mockEnv.NEXT_PUBLIC_LUXURY_FEATURES = JSON.stringify({
      contentMerchandising: true,
      blog: true,
    });
    mockFetchPublishedPosts.mockResolvedValueOnce([
      {
        title: "Title",
        excerpt: "Excerpt",
        slug: "test-slug",
        products: ["sku-1"],
      },
    ]);
    render(await ShopIndexPage({ params: { lang: "en" } }));
    expect(screen.getByTestId("blog-listing")).toBeInTheDocument();
  });

  it("omits BlogListing when feature flags are disabled", async () => {
    mockEnv.NEXT_PUBLIC_LUXURY_FEATURES = JSON.stringify({
      contentMerchandising: false,
      blog: false,
    });
    render(await ShopIndexPage({ params: { lang: "en" } }));
    expect(screen.queryByTestId("blog-listing")).toBeNull();
    expect(mockFetchPublishedPosts).not.toHaveBeenCalled();
  });

  it("swallows fetchPublishedPosts errors without breaking page render", async () => {
    mockEnv.NEXT_PUBLIC_LUXURY_FEATURES = JSON.stringify({
      contentMerchandising: true,
      blog: true,
    });
    mockFetchPublishedPosts.mockRejectedValueOnce(new Error("boom"));
    render(await ShopIndexPage({ params: { lang: "en" } }));
    expect(screen.queryByTestId("blog-listing")).toBeNull();
    expect(screen.getByTestId("shop-client")).toBeInTheDocument();
  });
});
