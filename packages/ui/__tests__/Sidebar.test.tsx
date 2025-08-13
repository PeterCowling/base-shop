import { render, screen } from "@testing-library/react";
import Sidebar from "../src/components/cms/Sidebar.client";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Sidebar", () => {
  it("shows Shops link and highlights it on /cms/shop", () => {
    mockPathname.mockReturnValue("/cms/shop");

    const { container } = render(<Sidebar />);
    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[1]).toHaveTextContent("Shops");
    expect(links[1].getAttribute("href")).toBe("/cms/shop");
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("omits Shops link when shop slug is present", () => {
    mockPathname.mockReturnValue("/cms/shop/abc/products");

    render(<Sidebar />);
    expect(screen.queryByText("Shops")).toBeNull();
  });

  it("shows Theme link for shop owners", () => {
    mockPathname.mockReturnValue("/cms/shop/abc");

    render(<Sidebar role="ShopAdmin" />);
    const theme = screen.getByText("Theme");
    expect(theme.closest("a")).toHaveAttribute(
      "href",
      "/cms/shop/abc/themes",
    );
  });

  it("hides Theme link for viewers", () => {
    mockPathname.mockReturnValue("/cms/shop/abc");

    render(<Sidebar role="viewer" />);
    expect(screen.queryByText("Theme")).toBeNull();
  });
});
