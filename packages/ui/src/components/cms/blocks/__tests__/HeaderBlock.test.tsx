import { render } from "@testing-library/react";
import HeaderBlock from "../HeaderBlock";

jest.mock("../../../organisms/Header", () => {
  const React = require("react");
  return {
    __esModule: true,
    Header: jest.fn((props) => <div data-testid="header" {...props} />),
  };
});

const { Header } = require("../../../organisms/Header") as {
  Header: jest.Mock;
};

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
      />,
    );
    expect(Header).toHaveBeenCalledTimes(1);
    expect(Header.mock.calls[0][0]).toEqual({
      nav,
      logoVariants,
      shopName: "Shop",
      locale: "en",
    });
  });
});
