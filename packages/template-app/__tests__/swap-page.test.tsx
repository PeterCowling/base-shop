/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import SwapPage from "../src/app/account/swaps/page";
import { notFound } from "next/navigation";
import { getCart } from "@acme/platform-core/cartStore";
import { getCustomerSession } from "@acme/auth";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getUserPlan, getRemainingSwaps } from "@acme/platform-core/repositories/subscriptionUsage.server";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "cookie" }) }),
}));

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "c",
  decodeCartCookie: () => "cart1",
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  getCart: jest.fn(),
  removeItem: jest.fn(),
  incrementQty: jest.fn(),
}));

jest.mock("@auth", () => ({ getCustomerSession: jest.fn() }));

jest.mock("@acme/platform-core/repositories/shops.server", () => ({ readShop: jest.fn() }));

jest.mock("@acme/platform-core/repositories/subscriptionUsage.server", () => ({
  getUserPlan: jest.fn(),
  getRemainingSwaps: jest.fn(),
  incrementSwapCount: jest.fn(),
}));

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

jest.mock("@date-utils", () => ({ nowIso: jest.fn(() => "2023-01-15") }));

jest.mock("@acme/platform-core/products", () => ({ getProductById: jest.fn() }));

describe("SwapPage", () => {
  it("calls notFound when subscriptions disabled", async () => {
    readShop.mockResolvedValue({ subscriptionsEnabled: false });
    await SwapPage();
    expect(notFound).toHaveBeenCalled();
  });

  it("renders cart with disabled swap when no swaps left", async () => {
    readShop.mockResolvedValue({
      subscriptionsEnabled: true,
      rentalSubscriptions: [],
    });
    getCart.mockResolvedValue({
      sku1: {
        sku: {
          id: "sku1",
          title: "Item",
          price: 0,
          deposit: 0,
          sizes: [],
          media: [],
          slug: "item",
        },
        qty: 1,
      },
    });
    getCustomerSession.mockResolvedValue({ customerId: "cust" });
    getUserPlan.mockResolvedValue(undefined);
    getRemainingSwaps.mockResolvedValue(0);
    const ui = (await SwapPage()) as ReactElement;
    render(ui);
    expect(screen.getByText("Item")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "account.swaps.action.swap" }),
    ).toBeDisabled();
  });
});
