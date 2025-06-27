// packages/platform-core/__tests__/currencyContext.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { CurrencyProvider, useCurrency } from "../contexts/CurrencyContext";

describe("CurrencyContext", () => {
  function ShowCurrency() {
    const [currency, setCurrency] = useCurrency();
    return <button onClick={() => setCurrency("USD")}>{currency}</button>;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default currency and persists changes", () => {
    render(
      <CurrencyProvider>
        <ShowCurrency />
      </CurrencyProvider>
    );

    const btn = screen.getByRole("button");
    expect(btn.textContent).toBe("EUR");
    fireEvent.click(btn);
    expect(btn.textContent).toBe("USD");
    expect(localStorage.getItem("PREFERRED_CURRENCY")).toBe("USD");
  });

  it("throws when used outside provider", () => {
    // Suppress expected error output
    const orig = console.error;
    console.error = () => {};
    expect(() => useCurrency()).toThrow("inside CurrencyProvider");
    console.error = orig;
  });
});
