import "../../../test/resetNextMocks";

import { readShop } from "@acme/platform-core/repositories/json.server";

import Header from "../src/components/layout/Header";

jest.mock("@acme/platform-core/repositories/json.server", () => ({
  readShop: jest.fn(),
}));

const getCart = jest.fn();

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: jest.fn(() => "cart-1"),
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  createCartStore: jest.fn(() => ({ getCart })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => ({ value: "encoded" }) }),
}));

jest.mock("../src/components/layout/HeaderClient.client", () => ({
  __esModule: true,
  default: () => null,
}));

describe("Header (server) – initial cart qty", () => {
  it("sums cart line quantities when cookie is present", async () => {
    (readShop as jest.Mock).mockResolvedValue({ navigation: [] });
    getCart.mockResolvedValue({
      a: { qty: 2 },
      b: { qty: 3 },
    });

    const result = await Header({ lang: "en" });
    expect(result.props.initialQty).toBe(5);
  });
});

