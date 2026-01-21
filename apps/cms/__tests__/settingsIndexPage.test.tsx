import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import SettingsIndexPage from "../src/app/cms/settings/page";

const mockShops = ["alpine", "brooklyn"];

const listShopsMock = jest.fn().mockResolvedValue(mockShops);
const shopChooserMock = jest.fn((props: any) => <div data-testid="shop-chooser" />);

jest.mock("../src/app/cms/settings/../../../lib/listShops", () => ({
  listShops: listShopsMock,
}));

jest.mock("@/components/cms/ShopChooser", () => ({
  __esModule: true,
  default: shopChooserMock,
}));

describe("SettingsIndexPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listShopsMock.mockResolvedValue(mockShops);
  });

  it("renders hero copy and wires ShopChooser props", async () => {
    const Page = await SettingsIndexPage();

    render(Page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Govern storefront policies with confidence" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a new shop" })).toHaveAttribute("href", "/cms/configurator");
    expect(screen.getByRole("link", { name: "Browse existing shops" })).toHaveAttribute("href", "#shop-selection");

    expect(shopChooserMock).toHaveBeenCalledTimes(1);
    const props = shopChooserMock.mock.calls[0][0];
    expect(props.shops).toEqual(mockShops);
    expect(props.tag).toBe("Settings · Configuration hubs");
    mockShops.forEach((shop) => {
      expect(props.card.href(shop)).toBe(`/cms/shop/${shop}/settings`);
    });
  });
});
