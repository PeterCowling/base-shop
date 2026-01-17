import { render, screen } from "@testing-library/react";

jest.mock("@cms/actions/blog.server", () => ({
  getPosts: jest.fn(),
}));

jest.mock("@acme/platform-core/shops", () => ({
  getSanityConfig: jest.fn().mockReturnValue({}),
}));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn().mockResolvedValue({}),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock("@acme/ui", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
}));

describe("BlogPostsPage", () => {
  test("shows scheduled status for future posts", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const { getPosts } = require("@cms/actions/blog.server");
    getPosts.mockResolvedValue([
      { _id: "1", title: "Post", published: true, publishedAt: future },
    ]);
    const Page = (await import("../src/app/cms/blog/posts/page")).default;
    render(await Page({ searchParams: { shopId: "s" } }));
    expect(screen.getByText(/scheduled for/i)).toBeInTheDocument();
  });
});
