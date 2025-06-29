const { describe, it, expect, beforeEach } = require("@jest/globals");
const React = require("react");
const {
  render,
  screen,
  fireEvent,
  waitFor,
} = require("@testing-library/react");
const CurrencySwitcher =
  require("../components/molecules/CurrencySwitcher.tsx").default;
const { CurrencyProvider } = require("@/contexts/CurrencyContext");

describe("CurrencySwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates localStorage and displayed currency", async () => {
    render(
      React.createElement(
        CurrencyProvider,
        null,
        React.createElement(CurrencySwitcher, null)
      )
    );

    const trigger = screen.getByRole("button");
    expect(trigger.textContent).toBe("EUR");

    fireEvent.mouseDown(trigger);
    fireEvent.click(screen.getByText("USD"));

    await waitFor(() => {
      expect(localStorage.getItem("PREFERRED_CURRENCY")).toBe("USD");
      expect(trigger.textContent).toBe("USD");
    });
  });
});
