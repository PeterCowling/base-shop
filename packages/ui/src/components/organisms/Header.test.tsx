import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import "../../../../../test/resetNextMocks";
import useViewport from "../../hooks/useViewport";

jest.mock("../../hooks/useViewport");

const mockUseViewport = useViewport as jest.Mock;

describe("Header", () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue("desktop");
  });

  it("renders dropdown menu and search bar", async () => {
    const nav = [
      {
        title: "Products",
        href: "/products",
        items: [{ title: "Shoes", href: "/products/shoes" }],
      },
    ];
    render(
      <Header
        locale="en"
        nav={nav}
        shopName="Shop"
        searchSuggestions={[]}
      />,
    );

    const productsLink = screen.getByRole("link", { name: "Products" });
    await userEvent.hover(productsLink);
    const submenuItem = screen.getByRole("link", { name: "Shoes" });
    expect(submenuItem).toBeInTheDocument();

    const dropdown = submenuItem.closest("div");
    expect(dropdown).toHaveClass("hidden");

    expect(
      screen.getByRole("searchbox", { name: "Search products" }),
    ).toBeVisible();
  });

  it("selects logo variant based on viewport", () => {
    mockUseViewport.mockReturnValue("mobile");
    const logoVariants = {
      mobile: { src: "/logo-mobile.png", width: 50, height: 20 },
      desktop: { src: "/logo-desktop.png", width: 100, height: 40 },
    };
    render(
      <Header locale="en" shopName="Shop" logoVariants={logoVariants} />,
    );
    const logo = screen.getByRole("img", { name: "Shop" }) as HTMLImageElement;
    const src = decodeURIComponent(logo.getAttribute("src") ?? "");
    expect(src).toContain("/logo-mobile.png");
  });
});
