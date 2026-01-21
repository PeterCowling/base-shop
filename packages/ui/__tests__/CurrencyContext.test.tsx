import { configure, fireEvent, render, screen } from "@testing-library/react";

import { CurrencyProvider, useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

// React 19 requires this flag for `act` to suppress environment warnings
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

configure({ testIdAttribute: "data-testid" });

function Display() {
  const [currency, setCurrency] = useCurrency();
  return (
    <>
      <span data-testid="currency">{currency}</span>
      <button onClick={() => setCurrency("USD")}>change</button>
    </>
  );
}

describe("CurrencyContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("defaults to EUR and toggles/persists to USD", () => {
    render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );

    const cur = screen.getByTestId("currency");
    expect(cur.textContent).toBe("EUR");
    fireEvent.click(screen.getByText("change"));
    expect(cur.textContent).toBe("USD");
    expect(localStorage.getItem("PREFERRED_CURRENCY")).toBe("USD");
  });

  it("uses currency from localStorage when available", () => {
    localStorage.setItem("PREFERRED_CURRENCY", "GBP");
    render(
      <CurrencyProvider>
        <Display />
      </CurrencyProvider>
    );
    expect(screen.getByTestId("currency").textContent).toBe("GBP");
  });

  it("throws when useCurrency called outside provider", () => {
    const orig = console.error;
    console.error = () => {};
    expect(() => useCurrency()).toThrow("useCurrency must be inside CurrencyProvider");
    console.error = orig;
  });
});
