import React from "react";
import { render, screen } from "@testing-library/react";

describe("layout/Header (server)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SHOP_ID;
    delete process.env.NEXT_PUBLIC_DEFAULT_SHOP;
  });

  test("resolves shopId from x-shop-id header when present", async () => {
    const readShop = jest.fn(async () => ({
      navigation: [
        { label: { en: "Home", de: "Startseite" }, url: "/" },
        { label: "Shop", url: "/shop" },
      ],
    }));
    jest.doMock("@acme/platform-core/repositories/json.server", () => ({ readShop }));

    jest.doMock("@acme/platform-core/cartCookie", () => ({
      CART_COOKIE: "__Host-CART_ID",
      decodeCartCookie: jest.fn(() => null),
    }));
    jest.doMock("@acme/platform-core/cartStore", () => ({
      createCartStore: () => ({ getCart: jest.fn(async () => ({})) }),
    }));

    const hdrs = new Headers({ "x-shop-id": "shop-de" });
    jest.doMock("next/headers", () => ({
      cookies: async () => ({ get: () => undefined }),
      headers: async () => hdrs,
    }));

    jest.doMock("../HeaderClient.client", () => ({
      __esModule: true,
      default: (props: unknown) => (
        <div data-cy="header-client" data-props={JSON.stringify(props)} />
      ),
    }));

    const Header = (await import("../Header")).default as (props: { lang: string }) => Promise<React.ReactElement>;
    render(await Header({ lang: "de" }));

    expect(readShop).toHaveBeenCalledWith("shop-de");

    const props = JSON.parse(screen.getByTestId("header-client").getAttribute("data-props") ?? "{}") as {
      nav?: Array<{ label: string }>;
    };
    expect(props.nav?.[0]?.label).toBe("Startseite");
  });

  test("falls back to NEXT_PUBLIC_SHOP_ID when no header is present", async () => {
    process.env.NEXT_PUBLIC_SHOP_ID = "shop-env";
    const readShop = jest.fn(async () => ({ navigation: [] }));
    jest.doMock("@acme/platform-core/repositories/json.server", () => ({ readShop }));

    jest.doMock("@acme/platform-core/cartCookie", () => ({
      CART_COOKIE: "__Host-CART_ID",
      decodeCartCookie: jest.fn(() => null),
    }));
    jest.doMock("@acme/platform-core/cartStore", () => ({
      createCartStore: () => ({ getCart: jest.fn(async () => ({})) }),
    }));

    jest.doMock("next/headers", () => ({
      cookies: async () => ({ get: () => undefined }),
      headers: async () => new Headers(),
    }));

    jest.doMock("../HeaderClient.client", () => ({
      __esModule: true,
      default: () => <div data-cy="header-client" />,
    }));

    const Header = (await import("../Header")).default as (props: { lang: string }) => Promise<React.ReactElement>;
    render(await Header({ lang: "en" }));

    expect(readShop).toHaveBeenCalledWith("shop-env");
  });

  test("throws when neither header nor env provides a shop id", async () => {
    const readShop = jest.fn(async () => ({ navigation: [] }));
    jest.doMock("@acme/platform-core/repositories/json.server", () => ({ readShop }));

    jest.doMock("@acme/platform-core/cartCookie", () => ({
      CART_COOKIE: "__Host-CART_ID",
      decodeCartCookie: jest.fn(() => null),
    }));
    jest.doMock("@acme/platform-core/cartStore", () => ({
      createCartStore: () => ({ getCart: jest.fn(async () => ({})) }),
    }));

    jest.doMock("next/headers", () => ({
      cookies: async () => ({ get: () => undefined }),
      headers: async () => new Headers(),
    }));

    const Header = (await import("../Header")).default as (props: { lang: string }) => Promise<React.ReactElement>;
    await expect(Header({ lang: "en" })).rejects.toThrow("Missing shop context");
    expect(readShop).not.toHaveBeenCalled();
  });
});
