import { render, screen } from "@testing-library/react";

const listShopsMock = jest.fn();
const listEventsMock = jest.fn();

jest.mock("../src/lib/listShops", () => ({
  listShops: (...args: unknown[]) => listShopsMock(...args),
}));

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("MarketingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders campaign links for multiple shops", async () => {
    listShopsMock.mockResolvedValue(["shop1", "shop2"]);
    listEventsMock.mockImplementation(async (shop: string) => {
      if (shop === "shop1") {
        return [
          { campaign: "c1" },
          { campaign: "c2" },
          { campaign: "c1" },
        ];
      }
      if (shop === "shop2") {
        return [{ campaign: "c3" }];
      }
      return [];
    });

    const Page = (await import("../src/app/cms/marketing/page")).default;
    render(await Page());

    expect(screen.getByText("Campaign Analytics")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "c1" })).toHaveAttribute(
      "href",
      "/cms/dashboard/shop1?campaign=c1",
    );
    expect(screen.getByRole("link", { name: "c2" })).toHaveAttribute(
      "href",
      "/cms/dashboard/shop1?campaign=c2",
    );
    expect(screen.getByRole("link", { name: "c3" })).toHaveAttribute(
      "href",
      "/cms/dashboard/shop2?campaign=c3",
    );
  });

  it("handles no campaigns gracefully", async () => {
    listShopsMock.mockResolvedValue(["shop1"]);
    listEventsMock.mockResolvedValue([]);

    const Page = (await import("../src/app/cms/marketing/page")).default;
    render(await Page());

    expect(screen.queryByText("Campaign Analytics")).not.toBeInTheDocument();
  });
});

