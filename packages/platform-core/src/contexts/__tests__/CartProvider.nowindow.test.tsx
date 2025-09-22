import { act, render, screen, configure } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { SKU } from "@acme/types";
import { clearCartStorage, setupFetchMock, mockNoWindow } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("CartProvider without window", () => {
  const sku: SKU = {
    id: "sku1",
    slug: "sku1",
    title: "Test",
    price: 100,
    deposit: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "img", type: "image" }],
    sizes: [],
    description: "desc",
  };

  let dispatch: (action: any) => Promise<void>;
  function Consumer() {
    const [cart, d] = useCart();
    dispatch = d;
    return <div data-testid="count">{Object.keys(cart).length}</div>;
  }

  let fetchMock: jest.Mock;
  let restoreFetch: () => void;
  let restoreWindow: () => void;

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
    restoreWindow = mockNoWindow();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: {} }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cart: { sku1: { sku, qty: 1 } } }),
      });
  });

  afterEach(() => {
    restoreFetch();
    restoreWindow();
  });

  it("handles add without window", async () => {
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );

    await act(async () => {
      await dispatch({ type: "add", sku });
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
  });
});

