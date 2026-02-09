import { fireEvent, render, waitFor } from "@testing-library/react";

import {
  CurrencyProvider,
  useCurrency,
} from "@acme/platform-core/contexts/CurrencyContext";

// React 19 requires this flag for `act` to suppress environment warnings
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Display() {
  const [currency, setCurrency] = useCurrency();
  return (
    <>
      <span data-cy="currency">{currency}</span>
      <button onClick={() => setCurrency("USD")}>usd</button>
      <button onClick={() => setCurrency("GBP")}>gbp</button>
    </>
  );
}

/**
 * These tests run against the mock in test/__mocks__/currencyContextMock.tsx
 * (mapped by jest.moduleMapper.cjs). They verify storefront integration with
 * the CurrencyContext API surface. Full implementation tests (localStorage,
 * throws, window override) live in packages/platform-core.
 */
describe("CurrencyContext", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("defaults to EUR", () => {
    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );
    expect(getByTestId("currency").textContent).toBe("EUR");
    unmount();
  });

  it("switches currency on user interaction", async () => {
    const { getByText, getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    fireEvent.click(getByText("usd"));
    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("USD");
    });

    fireEvent.click(getByText("gbp"));
    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("GBP");
    });

    unmount();
  });
});
