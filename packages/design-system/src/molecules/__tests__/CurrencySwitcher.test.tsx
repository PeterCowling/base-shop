import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import CurrencySwitcher from "../CurrencySwitcher.client";

const setCurrencySpy = jest.fn();

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => {
  const React = require("react");
  return {
    useCurrency: () => {
      const [currency, setCurrency] = React.useState("USD");
      return [currency, (v: string) => {
        setCurrency(v);
        setCurrencySpy(v);
      }] as const;
    },
  };
});

describe("CurrencySwitcher", () => {
  it("calls setCurrency when selecting a new currency and shows it", async () => {
    const { container } = render(<CurrencySwitcher />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const eurOption = screen.getByRole("option", { name: "EUR" });
    const usdOption = screen.getByRole("option", { name: "USD" });
    const gbpOption = screen.getByRole("option", { name: "GBP" });

    expect(eurOption).toBeInTheDocument();

    expect(usdOption).toBeInTheDocument();
    expect(gbpOption).toBeInTheDocument();

    fireEvent.click(eurOption);

    expect(setCurrencySpy).toHaveBeenCalledWith("EUR");
    expect(trigger).toHaveTextContent("EUR");
  });
});
