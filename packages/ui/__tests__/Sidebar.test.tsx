import { fireEvent, render, screen } from "@testing-library/react";
import Sidebar from "../src/components/cms/Sidebar.client";

describe("Sidebar", () => {
  it("shows Shops link and highlights it on /cms/shop", () => {
    const { container } = render(<Sidebar pathname="/cms/shop" />);
    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[1]).toHaveTextContent("Shops");
    expect(links[1].getAttribute("href")).toBe("/cms/shop");
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("omits Shops link when shop slug is present", () => {
    render(<Sidebar pathname="/cms/shop/abc/products" />);
    expect(screen.queryByText("Shops")).toBeNull();
  });

  it("shows Theme link for shop owners", () => {
    render(<Sidebar pathname="/cms/shop/abc" role="ShopAdmin" />);
    const theme = screen.getByText("Theme");
    expect(theme.closest("a")).toHaveAttribute(
      "href",
      "/cms/shop/abc/themes",
    );
  });

  it("hides Theme link for viewers", () => {
    render(<Sidebar pathname="/cms/shop/abc" role="viewer" />);
    expect(screen.queryByText("Theme")).toBeNull();
  });

  it("notifies when starting a new configurator", () => {
    const handler = jest.fn();
    render(
      <Sidebar
        pathname="/cms"
        role="admin"
        onConfiguratorStartNew={handler}
      />,
    );
    const link = screen.getByText("New Shop (Configurator)");
    fireEvent.click(link);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
