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

describe("CurrencyContext", () => {
  const LS_KEY = "PREFERRED_CURRENCY";

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it("defaults to EUR when nothing stored", () => {
    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );
    expect(getByTestId("currency").textContent).toBe("EUR");
    unmount();
  });

  it("initializes from localStorage when a valid currency is stored", () => {
    window.localStorage.setItem(LS_KEY, "USD");

    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("USD");
    unmount();
  });

  it("switches currency and persists the change", async () => {
    const { getByText, getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    fireEvent.click(getByText("usd"));
    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("USD");
      expect(window.localStorage.getItem(LS_KEY)).toBe("USD");
    });

    fireEvent.click(getByText("gbp"));
    await waitFor(() => {
      expect(getByTestId("currency").textContent).toBe("GBP");
      expect(window.localStorage.getItem(LS_KEY)).toBe("GBP");
    });

    unmount();
  });

  it("falls back to EUR when localStorage contains unsupported currency", () => {
    window.localStorage.setItem(LS_KEY, "CAD");

    const { getByTestId, unmount } = render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    expect(getByTestId("currency").textContent).toBe("EUR");
    unmount();
  });

  it("throws when useCurrency is called outside provider", () => {
    function Bare() {
      useCurrency();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(
      "useCurrency must be inside CurrencyProvider"
    );
  });
});
