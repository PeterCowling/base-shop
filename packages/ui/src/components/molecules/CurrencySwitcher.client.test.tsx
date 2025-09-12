import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencySwitcher from "./CurrencySwitcher.client";

const setCurrencySpy = jest.fn();

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => {
  const React = require("react");
  return {
    useCurrency: () => {
      const [currency, setCurrency] = React.useState("USD");
      return [
        currency,
        (v: string) => {
          setCurrency(v);
          setCurrencySpy(v);
        },
      ] as const;
    },
  };
});

describe("CurrencySwitcher client", () => {
  it("updates currency selection and invokes callback", async () => {
    const user = userEvent.setup();
    render(<CurrencySwitcher />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["EUR", "USD", "GBP"]);

    await user.click(screen.getByRole("option", { name: "EUR" }));
    expect(setCurrencySpy).toHaveBeenCalledWith("EUR");
    expect(trigger).toHaveTextContent("EUR");

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "GBP" }));
    expect(setCurrencySpy).toHaveBeenCalledWith("GBP");
    expect(trigger).toHaveTextContent("GBP");
  });
});
