import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

// Mock dependencies before importing the page
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));
jest.mock("@cms/actions/shops.server", () => ({ resetThemeOverride: jest.fn() }));
jest.mock("@acme/lib", () => ({ checkShopExists: jest.fn().mockResolvedValue(true) }));
const mockReadSettings = jest.fn();
const mockReadShop = jest.fn();
jest.mock("@platform-core/repositories/json.server", () => ({
  readSettings: (...args: any[]) => mockReadSettings(...args),
  readShop: (...args: any[]) => mockReadShop(...args),
}));
jest.mock("next-auth", () => ({ getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }) }));
jest.mock("next/dynamic", () => () => () => null);

import SettingsPage from "../src/app/cms/shop/[shop]/settings/page";

describe("Shop settings page", () => {
  it("shows default and override tokens with reset button", async () => {
    mockReadSettings.mockResolvedValue({
      languages: ["en"],
      currency: "USD",
      taxRegion: "US",
    });
    mockReadShop.mockResolvedValue({
      themeId: "base",
      themeDefaults: {
        "--color-bg": "#ffffff",
        "--color-primary": "#00f",
      },
      themeOverrides: { "--color-bg": "#000000" },
      catalogFilters: [],
      filterMappings: {},
    });

    const Page = await SettingsPage({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);

    const bgRow = screen.getByText("--color-bg").closest("tr")!;
    expect(within(bgRow).getByText("#ffffff")).toBeInTheDocument();
    expect(within(bgRow).getByText("#000000")).toBeInTheDocument();
    expect(within(bgRow).getByRole("button", { name: /reset/i })).toBeInTheDocument();

    const primaryRow = screen.getByText("--color-primary").closest("tr")!;
    expect(within(primaryRow).getByText("#00f")).toBeInTheDocument();
    expect(within(primaryRow).queryByRole("button", { name: /reset/i })).toBeNull();
  });
});
