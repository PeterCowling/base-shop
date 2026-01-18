import { render, screen } from "@testing-library/react";
import HeaderBlock from "../HeaderBlock";

jest.mock("next/image", () => {
  const Img = (props: any) => {
    const { alt, ...rest } = props || {};
    return <img alt={alt ?? ""} {...rest} />;
  };
  Img.displayName = "MockNextImage";
  return Img;
});

let viewport: "desktop" | "mobile" = "desktop";
jest.mock("../../../organisms/Header", () => {
  const React = require("react");
  return {
    __esModule: true,
    Header: jest.fn(({ logoVariants, shopName, showSearch }: any) => (
      <header>
        {logoVariants && (
          <img src={logoVariants[viewport]?.src} alt={shopName} />
        )}
        {showSearch && (
          <input role="searchbox" aria-label="Search products" />
        )}
      </header>
    )),
  };
});

jest.mock("../../../../hooks/useViewport", () => {
  return () => viewport;
});

const { Header } = require("../../../organisms/Header") as { Header: jest.Mock };

describe("HeaderBlock", () => {
  afterEach(() => {
    Header.mockClear();
  });

  it("passes empty nav array and forwards shopName and locale", () => {
    render(<HeaderBlock shopName="Shop" locale="en" />);
    expect(Header).toHaveBeenCalledTimes(1);
    expect(Header.mock.calls[0][0]).toEqual({
      nav: [],
      logoVariants: undefined,
      shopName: "Shop",
      locale: "en",
    });
  });

  it("forwards provided nav and logoVariants", () => {
    const nav = [{ title: "Home", href: "/" }];
    const logoVariants = { desktop: { src: "logo.png" } };
    render(
      <HeaderBlock
        nav={nav}
        logoVariants={logoVariants}
        shopName="Shop"
        locale="en"
      />
    );
    expect(Header).toHaveBeenCalledTimes(1);
    expect(Header.mock.calls[0][0]).toEqual({
      nav,
      logoVariants,
      shopName: "Shop",
      locale: "en",
    });
  });

  it("renders desktop menu on large screens", () => {
    viewport = "desktop";
    const nav = [{ title: "Home", href: "/" }];
    const logoVariants = {
      desktop: { src: "desktop.png", width: 100, height: 40 },
      mobile: { src: "mobile.png", width: 50, height: 20 },
    };
    render(
      <HeaderBlock
        nav={nav}
        logoVariants={logoVariants}
        shopName="Shop"
        locale="en"
      />
    );
    const logo = screen.getByRole("img", { name: "Shop" });
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("desktop.png"),
    );
  });

  it("renders mobile menu on small screens", () => {
    viewport = "mobile";
    const nav = [{ title: "Home", href: "/" }];
    const logoVariants = {
      desktop: { src: "desktop.png", width: 100, height: 40 },
      mobile: { src: "mobile.png", width: 50, height: 20 },
    };
    render(
      <HeaderBlock
        nav={nav}
        logoVariants={logoVariants}
        shopName="Shop"
        locale="en"
      />
    );
    const logo = screen.getByRole("img", { name: "Shop" });
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("mobile.png"),
    );
  });

  it("shows search bar when showSearch prop is true", () => {
    viewport = "desktop";
    const nav = [{ title: "Home", href: "/" }];
    render(
      <HeaderBlock nav={nav} shopName="Shop" locale="en" showSearch />
    );
    expect(
      screen.getByRole("searchbox", { name: /search products/i })
    ).toBeInTheDocument();
  });
});
