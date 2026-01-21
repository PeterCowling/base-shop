import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { readShop } from "@acme/platform-core/repositories/shops.server";

import ThemeStyle from "../src/components/ThemeStyle";

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

const mockReadShop = readShop as jest.MockedFunction<typeof readShop>;

describe("ThemeStyle", () => {
  beforeEach(() => {
    mockReadShop.mockReset();
  });

  it("returns null when no shop or token data is provided", async () => {
    const result = await ThemeStyle({});
    expect(result).toBeNull();
    expect(mockReadShop).not.toHaveBeenCalled();
  });

  it("renders theme styles and Google Fonts from shop data", async () => {
    mockReadShop.mockResolvedValue({
      themeTokens: {
        "--font-body": '"Inter", sans-serif',
        "--font-heading-1": '"Roboto"',
        "--font-heading-2": "var(--font-custom), Arial",
        "--color-accent": "var(--color-accent)",
      },
    } as any);

    const element = await ThemeStyle({ shopId: "shop-123" });
    expect(mockReadShop).toHaveBeenCalledWith("shop-123");
    expect(element).not.toBeNull();

    const html = renderToStaticMarkup(element!);

    expect(html).toContain("data-shop-theme");
    expect(html).toContain("--font-sans: var(--font-body);");
    expect(html).toContain("family=Inter&amp;display=swap");
    expect(html).toContain("family=Roboto&amp;display=swap");
    expect(html).not.toContain("family=Arial");
  });

  it("returns null for an explicit empty token set", async () => {
    const element = await ThemeStyle({ tokens: {} });
    expect(mockReadShop).not.toHaveBeenCalled();
    expect(element).toBeNull();
  });
});
