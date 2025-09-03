import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CurrencySwitcher from "../CurrencySwitcher.client";

const setCurrencySpy = jest.fn();

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => {
  const React = require("react");
  return {
    useCurrency: () => {
      const [currency, setCurrency] = React.useState("EUR");
      return [
        currency,
        (newCurrency: string) => {
          setCurrency(newCurrency);
          setCurrencySpy(newCurrency);
        },
      ] as const;
    },
  };
});

beforeAll(() => {
  // Radix Select calls scrollIntoView which JSDOM doesn't implement
  (window.HTMLElement.prototype as any).scrollIntoView = jest.fn();
});

describe("CurrencySwitcher", () => {
  it("lists currencies and updates selection", async () => {
    render(<CurrencySwitcher />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    for (const c of ["EUR", "USD", "GBP"]) {
      expect(await screen.findByRole("option", { name: c })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("option", { name: "USD" }));

    expect(setCurrencySpy).toHaveBeenCalledWith("USD");
    expect(screen.getByRole("combobox")).toHaveTextContent("USD");
  });
});

