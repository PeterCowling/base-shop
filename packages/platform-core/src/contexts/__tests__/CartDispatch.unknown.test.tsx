import { act, configure,render, waitFor } from "@testing-library/react";

import { CartProvider, useCart } from "../CartContext";

import { clearCartStorage, setupFetchMock } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("Cart dispatch: unknown actions", () => {
  let fetchMock: jest.Mock;
  let restoreFetch: () => void;
  let dispatch: (action: any) => Promise<void>;
  let cartState: Record<string, any>;

  function Capture() {
    [cartState, dispatch] = useCart();
    return null;
  }

  beforeEach(() => {
    clearCartStorage();
    ({ fetchMock, restore: restoreFetch } = setupFetchMock());
  });

  afterEach(() => {
    restoreFetch();
  });

  it("ignores unknown action without network call", async () => {
    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await dispatch({ type: "unknown" } as any);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores unknown action and leaves state unchanged", async () => {
    render(
      <CartProvider>
        <Capture />
      </CartProvider>
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await act(async () => {
      await dispatch({ type: "unknown" } as any);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(cartState).toEqual({});
  });
});

