import { usePathname } from "next/navigation";
import { render, screen, waitFor } from "@testing-library/react";

import BreadcrumbsClient from "../src/components/cms/Breadcrumbs.client";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("CMS Breadcrumbs client", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders product breadcrumbs with fetched title", async () => {
    mockPathname.mockReturnValue("/cms/shop/acme/products/123");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: { en: "Product 123" } }),
    }) as any;

    render(<BreadcrumbsClient />);

    await screen.findByText("Product 123");

    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "href",
      "/cms/shop"
    );
    expect(screen.getByRole("link", { name: "acme" })).toHaveAttribute(
      "href",
      "/cms/shop/acme"
    );
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/cms/shop/acme/products"
    );
    expect(screen.queryByRole("link", { name: "Product 123" })).toBeNull();
    expect(screen.getByText("Product 123")).toBeInTheDocument();
  });

  it("renders page breadcrumbs with fetched title", async () => {
    mockPathname.mockReturnValue("/cms/shop/acme/pages/about");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ slug: "about", seo: { title: "About Us" } }],
    }) as any;

    render(<BreadcrumbsClient />);

    await screen.findByText("About Us");

    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "href",
      "/cms/shop"
    );
    expect(screen.getByRole("link", { name: "acme" })).toHaveAttribute(
      "href",
      "/cms/shop/acme"
    );
    expect(screen.getByRole("link", { name: "Pages" })).toHaveAttribute(
      "href",
      "/cms/shop/acme/pages"
    );
    expect(screen.queryByRole("link", { name: "About Us" })).toBeNull();
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });

  it("falls back to path segment when fetch fails", async () => {
    mockPathname.mockReturnValue("/cms/shop/acme/products/999");
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;

    render(<BreadcrumbsClient />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(screen.getByText("999")).toBeInTheDocument();
  });
});

