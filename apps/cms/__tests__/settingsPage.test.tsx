import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

// Mock dependencies before importing the page
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));
jest.mock("@cms/actions/shops.server", () => ({ resetThemeOverride: jest.fn() }));
jest.mock("@acme/lib", () => ({ checkShopExists: jest.fn().mockResolvedValue(true) }));
const mockReadSettings = jest.fn();
const mockReadShop = jest.fn();
jest.mock("@acme/platform-core/repositories/json.server", () => ({
  readSettings: (...args: any[]) => mockReadSettings(...args),
  readShop: (...args: any[]) => mockReadShop(...args),
}));
jest.mock("@/components/atoms/shadcn", () => ({
  Button: ({ children }: any) => <>{children}</>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
import { __setMockSession } from "next-auth";
jest.mock("next/dynamic", () => () => () => null);

import SettingsPage from "../src/app/cms/shop/[shop]/settings/page";

describe("Shop settings page", () => {
  it("shows default and override tokens with reset button", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    mockReadSettings.mockResolvedValue({
      languages: ["en"],
      currency: "USD",
      taxRegion: "US",
    });
    mockReadShop.mockResolvedValue({
      themeId: "base",
      themeDefaults: {
        "--color-bg": "#ffffff", // eslint-disable-line ds/no-raw-color -- TEST-123: test fixture literal color
        "--color-primary": "#00f", // eslint-disable-line ds/no-raw-color -- TEST-123: test fixture literal color
      },
      themeOverrides: { "--color-bg": "#000000" }, // eslint-disable-line ds/no-raw-color -- TEST-123: test fixture literal color
      catalogFilters: [],
      filterMappings: {},
    });

    const Page = await SettingsPage({ params: Promise.resolve({ shop: "s1" }) });
    render(Page);

    expect(
      screen.getByRole("heading", { level: 1, name: /s1/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /configure services/i })
    ).toHaveAttribute("href", "#service-editors");
    expect(
      screen.getByRole("link", { name: /review theme tokens/i })
    ).toHaveAttribute("href", "#theme-tokens");
    expect(screen.getByText("Search & discovery")).toBeInTheDocument();
    expect(screen.getByText("Reverse logistics")).toBeInTheDocument();

    const bgRow = screen.getByText("--color-bg").closest("tr")!;
    expect(within(bgRow).getByText("#ffffff")).toBeInTheDocument(); // eslint-disable-line ds/no-raw-color -- TEST-123: asserting literal color text
    expect(within(bgRow).getByText("#000000")).toBeInTheDocument(); // eslint-disable-line ds/no-raw-color -- TEST-123: asserting literal color text
    expect(within(bgRow).getByRole("button", { name: /reset/i })).toBeInTheDocument();

    const primaryRow = screen.getByText("--color-primary").closest("tr")!;
    expect(within(primaryRow).getByText("#00f")).toBeInTheDocument(); // eslint-disable-line ds/no-raw-color -- TEST-123: asserting literal color text
    expect(within(primaryRow).queryByRole("button", { name: /reset/i })).toBeNull();
  });
});
