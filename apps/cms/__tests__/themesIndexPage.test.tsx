import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const mockShops = ["andromeda", "betelgeuse"];

const listShopsMock = jest.fn().mockResolvedValue(mockShops);
const shopChooserMock = jest.fn((props: any) => <div data-testid="shop-chooser" />);

jest.mock("../src/app/cms/themes/../../../lib/listShops", () => ({
  listShops: listShopsMock,
}));

jest.mock("@/components/cms/ShopChooser", () => ({
  __esModule: true,
  default: shopChooserMock,
}));

import ThemesIndexPage from "../src/app/cms/themes/page";

describe("ThemesIndexPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listShopsMock.mockResolvedValue(mockShops);
  });

  it("renders hero copy and passes expected props to ShopChooser", async () => {
    const Page = await ThemesIndexPage();

    render(Page);

    expect(screen.getByText("Themes · Choose a shop")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Tailor the look and feel per shop" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select a shop to swap themes, adjust palettes, and preview storefronts before publishing."
      )
    ).toBeInTheDocument();

    expect(shopChooserMock).toHaveBeenCalledTimes(1);
    const props = shopChooserMock.mock.calls[0][0];

    expect(props.shops).toEqual(mockShops);
    expect(props.tag).toBe("Themes · Studios");
    expect(props.heading).toBe("Theme studios");
    expect(props.subheading).toBe(
      "Apply curated experiences, manage theme versions, and schedule releases for each storefront."
    );

    mockShops.forEach((shop) => {
      expect(props.card.href(shop)).toBe(`/cms/shop/${shop}/themes`);
      expect(props.card.analyticsPayload(shop)).toEqual({ area: "themes", shop });
    });
  });
});
