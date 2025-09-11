import { readShop } from "@acme/platform-core/repositories/json.server";
import Header from "../src/components/layout/Header";
import "../../../test/resetNextMocks";

jest.mock("@acme/platform-core/repositories/json.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: jest.fn(() => undefined),
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  createCartStore: jest.fn(() => ({ getCart: jest.fn() })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => undefined }),
}));

jest.mock("../src/components/layout/HeaderClient.client", () => ({
  __esModule: true,
  default: () => null,
}));

describe("Header", () => {
  it("normalises navigation labels to strings", async () => {
    (readShop as jest.Mock).mockResolvedValue({
      navigation: [
        { label: "Plain", url: "/plain" },
        { label: { en: "English", fr: "French" }, url: "/en-fallback" },
        { label: { fr: "Bonjour", es: "Hola" }, url: "/first-value" },
        { label: 123, url: "/number" },
      ],
    });

    const result = await Header({ lang: "de" });

    expect(result.props.nav).toEqual([
      { label: "Plain", url: "/plain" },
      { label: "English", url: "/en-fallback" },
      { label: "Bonjour", url: "/first-value" },
      { label: "123", url: "/number" },
    ]);

    result.props.nav.forEach((item: { label: unknown }) => {
      expect(typeof item.label).toBe("string");
    });
  });
});

