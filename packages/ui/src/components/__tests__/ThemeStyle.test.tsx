// packages/ui/src/components/__tests__/ThemeStyle.test.tsx
import { render, screen } from "@testing-library/react";
import ThemeStyle from "../ThemeStyle";

describe("ThemeStyle", () => {
  test("returns null when no shopId and no tokens", async () => {
    const out = await ThemeStyle({} as any);
    expect(out).toBeNull();
  });

  test("renders style and font links when tokens provided", async () => {
    const el = await ThemeStyle({
      tokens: {
        "--font-body": '"Inter", system-ui, sans-serif',
        "--font-heading-1": '"Playfair Display", serif',
        "--color-bg-1": "0 0% 100%",
      },
    });

    render(<>{el}</>);

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
    expect(style!.innerHTML).toContain("--color-bg-1: 0 0% 100%;");
    // Alias added when --font-body is present
    expect(style!.innerHTML).toContain("--font-sans: var(--font-body);");
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
    render(<>{el}</>);
    expect(readShopMock).toHaveBeenCalledWith("shop-1");
    const style = document.querySelector("style[data-shop-theme]");
    expect(style!.innerHTML).toContain("--color-bg-1: 0 0% 96%;");
  });
});
