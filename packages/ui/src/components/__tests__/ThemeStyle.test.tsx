// packages/ui/src/components/__tests__/ThemeStyle.test.tsx
import { render, screen } from "@testing-library/react";

import ThemeStyle from "../ThemeStyle";

describe("ThemeStyle", () => {
  test("returns null when no shopId and no tokens", async () => {
    const out = await ThemeStyle({} as any);
    expect(out).toBeNull();
  });

  test("renders style and font links when explicitly enabled", async () => {
    const el = await ThemeStyle({
      tokens: {
        "--font-body": '"Inter", system-ui, sans-serif',
        "--font-heading-1": '"Playfair Display", serif',
        "--color-bg-1": "0 0% 100%",
      },
      allowRemoteFonts: true,
    });

    render(el as any);

    // Two Google font stylesheet link elements for declared families
    const links = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    ) as HTMLLinkElement[];
    const hrefs = links.map((l) => l.href);
    expect(hrefs.some((h) => h.includes("fonts.googleapis.com"))).toBe(true);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("family=Inter"),
        expect.stringContaining("family=Playfair+Display"),
      ])
    );

    // Style tag with data attribute
    const style = document.querySelector("style[data-shop-theme]");
    expect(style).toBeTruthy();
    expect(style!.textContent).toContain("--token-color-bg-1: 0 0% 100%;");
    // Alias added when --font-body is present
    expect(style!.textContent).toContain("--font-sans: var(--font-body);");
  });

  test("does not emit font links by default", async () => {
    const el = await ThemeStyle({
      tokens: {
        "--font-body": '"Inter", system-ui, sans-serif',
        "--font-heading-1": '"Playfair Display", serif',
        "--color-bg-1": "0 0% 100%",
      },
    });

    render(el as any);
    expect(document.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  test("filters invalid token keys/values and normalizes legacy keys", async () => {
    const el = await ThemeStyle({
      tokens: {
        "--color-bg-1": "0 0% 100%",
        "--font-body": '";}</style>',
        "--not-a-token": "123",
      },
    });

    render(el as any);
    const style = document.querySelector("style[data-shop-theme]");
    expect(style).toBeTruthy();
    expect(style!.textContent).toContain("--token-color-bg-1: 0 0% 100%;");
    expect(style!.textContent).not.toContain("--token-font-body");
    expect(style!.textContent).not.toContain("--not-a-token");
  });

  test("respects font allowlist when enabled", async () => {
    const el = await ThemeStyle({
      tokens: {
        "--font-body": '"Inter", system-ui, sans-serif',
        "--font-heading-1": '"Playfair Display", serif',
        "--color-bg-1": "0 0% 100%",
      },
      allowRemoteFonts: true,
      allowedFontFamilies: ["Inter"],
    });

    render(el as any);
    const links = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    ) as HTMLLinkElement[];
    const hrefs = links.map((l) => l.href);
    expect(hrefs.some((h) => h.includes("family=Inter"))).toBe(true);
    expect(hrefs.some((h) => h.includes("family=Playfair+Display"))).toBe(false);
  });

  test("fetches tokens by shopId when tokens not provided", async () => {
    jest.resetModules();
    const readShopMock = jest.fn().mockResolvedValue({
      themeTokens: {
        "--color-bg-1": "0 0% 96%",
        "--font-body": '"Inter", sans-serif',
      },
    });

    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      readShop: readShopMock,
    }));

    // Re-import the module under test so it picks up the mock
    const { default: Themed } = await import("../ThemeStyle");
    const el = await Themed({ shopId: "shop-1" });
    render(el as any);
    expect(readShopMock).toHaveBeenCalledWith("shop-1");
    const style = document.querySelector("style[data-shop-theme]");
    expect(style!.textContent).toContain("--token-color-bg-1: 0 0% 96%;");
  });
});
