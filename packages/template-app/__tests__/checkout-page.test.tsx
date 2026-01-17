/** @jest-environment jsdom */

import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import type { CartState } from "@acme/platform-core/cartCookie";
import CheckoutPage from "../src/app/[lang]/checkout/page";

jest.mock("next/headers", () => ({
  cookies: () => ({ get: () => ({ value: "cookie" }) }),
}));

jest.mock("@/components/checkout/CheckoutForm", () => {
  function CheckoutFormMock() {
    return <div data-cy="checkout-form" />;
  }
  return CheckoutFormMock;
});

jest.mock("@/components/organisms/OrderSummary", () => {
  function OrderSummaryMock(props: any) {
    const { cart = {}, totals = {} } = props ?? {};
    return (
      <div>
        <div data-cy="subtotal">{totals.subtotal}</div>
        <div data-cy="deposit">{totals.deposit}</div>
        <div data-cy="total">{totals.total}</div>
        {Object.values(cart).map((l: any) => (
          <div key={l.sku.id}>{l.sku.title}</div>
        ))}
      </div>
    );
  }
  return OrderSummaryMock;
});

jest.mock("@acme/platform-core/cartCookie", () => {
  const actual = jest.requireActual("@acme/platform-core/cartCookie");
  return { ...actual, decodeCartCookie: jest.fn(() => "cart") };
});

const getCartMock = jest.fn();
jest.mock("@acme/platform-core/cartStore", () => ({
  createCartStore: () => ({ getCart: getCartMock }),
}));

const getProductMock = jest.fn();
jest.mock("@acme/platform-core/products", () => ({
  getProductById: (id: string) => getProductMock(id),
}));

const settingsMock = jest.fn();
jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: () => settingsMock(),
}));

const shopMock = jest.fn();
jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: () => shopMock(),
}));

const priceForDaysMock = jest.fn();
const convertCurrencyMock = jest.fn((v: number) => v);
jest.mock("@acme/platform-core/pricing", () => ({
  priceForDays: (...args: any[]) => priceForDaysMock(...args),
  convertCurrency: (v: number) => convertCurrencyMock(v),
}));

describe("CheckoutPage", () => {
  beforeEach(() => {
    getCartMock.mockReset();
    getProductMock.mockReset();
    settingsMock.mockReset();
    shopMock.mockReset();
    priceForDaysMock.mockReset();
    convertCurrencyMock.mockReset().mockImplementation((v) => v);
  });

  it("renders purchase flow totals", async () => {
    const cart: CartState = {
      sku1: {
        sku: { id: "sku1", title: "Item", price: 100, deposit: 10 },
        qty: 2,
      },
    } as any;
    getCartMock.mockResolvedValue(cart);
    getProductMock.mockReturnValue(cart.sku1.sku);
    settingsMock.mockResolvedValue({ taxRegion: "EU", currency: "EUR" });
    shopMock.mockResolvedValue({ type: "sale" });

    const ui = (await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;
    render(ui);
    const [subtotal] = screen.getAllByTestId("subtotal").filter((node) => node.textContent);
    const [deposit] = screen.getAllByTestId("deposit").filter((node) => node.textContent);
    const [total] = screen.getAllByTestId("total").filter((node) => node.textContent);
    expect(subtotal).toHaveTextContent("200");
    expect(deposit).toHaveTextContent("20");
    expect(total).toHaveTextContent("220");
  });

  it("renders rental flow with pricing and deposit", async () => {
    const cart: CartState = {
      sku1: { sku: { id: "sku1", title: "Tent", deposit: 50 }, qty: 1 },
    } as any;
    getCartMock.mockResolvedValue(cart);
    getProductMock.mockReturnValue(cart.sku1.sku);
    settingsMock.mockResolvedValue({ taxRegion: "EU", currency: "EUR" });
    shopMock.mockResolvedValue({ type: "rental" });
    priceForDaysMock.mockResolvedValue(200);

    const ui = (await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;
    expect(priceForDaysMock).toHaveBeenCalled();
    render(ui);
    const [subtotal] = screen.getAllByTestId("subtotal").filter((node) => node.textContent);
    const [deposit] = screen.getAllByTestId("deposit").filter((node) => node.textContent);
    const [total] = screen.getAllByTestId("total").filter((node) => node.textContent);
    expect(subtotal).toHaveTextContent("200");
    expect(deposit).toHaveTextContent("50");
    expect(total).toHaveTextContent("250");
  });

  it("shows message for invalid return date in rental flow", async () => {
    const cart: CartState = {
      sku1: { sku: { id: "sku1", title: "Tent", deposit: 50 }, qty: 1 },
    } as any;
    getCartMock.mockResolvedValue(cart);
    getProductMock.mockReturnValue(cart.sku1.sku);
    settingsMock.mockResolvedValue({ taxRegion: "EU", currency: "EUR" });
    shopMock.mockResolvedValue({ type: "rental" });

    const ui = (await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({ returnDate: "not-a-date" }),
    })) as ReactElement;
    // The component returns a <p>Invalid return date.</p>
    expect(String((ui as any).props?.children)).toContain("Invalid return date");
  });
});
