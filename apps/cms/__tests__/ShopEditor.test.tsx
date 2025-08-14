import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopEditor from "../src/app/cms/shop/[shop]/settings/ShopEditor";
import { updateShop } from "@cms/actions/shops.server";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

describe("ShopEditor", () => {
  it("shows error for invalid JSON and prevents submission", async () => {
    const initial = {
      id: "1",
      name: "Test",
      themeId: "base",
      catalogFilters: [],
      themeOverrides: {},
      themeTokens: {},
      filterMappings: {},
      priceOverrides: {},
      localeOverrides: {},
    };

    render(
      <ShopEditor shop="shop" initial={initial} initialTrackingProviders={[]} />,
    );

    fireEvent.change(screen.getByLabelText(/theme tokens/i), {
      target: { value: "{invalid" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/invalid json/i)).toBeInTheDocument();
    expect(updateShop).not.toHaveBeenCalled();
  });
});
