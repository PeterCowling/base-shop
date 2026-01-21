import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { encodeCartCookie } from "@acme/platform-core/cartCookie";

import CheckoutPage from "./page";

const cookiesMock = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

const getCartMock = jest.fn();
jest.mock("@acme/platform-core/cartStore", () => ({
  createCartStore: () => ({ getCart: (...args: any[]) => getCartMock(...args) }),
}));

const getShopSettingsMock = jest.fn();
jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettingsMock(...args),
}));

jest.mock(
  "@/components/checkout/CheckoutForm",
  () => ({
    __esModule: true,
    default: (props: any) => <div data-cy="checkout-form" {...props} />,
  }),
  { virtual: true },
);
jest.mock(
  "@/components/organisms/OrderSummary",
  () => ({
    __esModule: true,
    default: () => <div data-cy="order-summary" />,
  }),
  { virtual: true },
);

describe("CheckoutPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    getCartMock.mockReset();
    getShopSettingsMock.mockReset();
  });

  it("renders empty state when cart is empty", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });

    const ui = (await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;
    render(ui);

    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("renders order summary and checkout form when cart has items", async () => {
    const cookie = encodeCartCookie("cart-id");
    cookiesMock.mockResolvedValue({ get: () => ({ value: cookie }) });
    getCartMock.mockResolvedValue({ line: {} });
    getShopSettingsMock.mockResolvedValue({ taxRegion: "US" });

    const ui = (await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    })) as ReactElement;
    const [summary, form] = (ui.props as { children: ReactElement[] }).children;
    render(ui);

    expect(screen.getAllByTestId("order-summary").length).toBeGreaterThan(0);
    expect(form).toBeTruthy();
  });
});
