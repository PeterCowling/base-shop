import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CurrencySwitcher from "../src/components/molecules/CurrencySwitcher.client";

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

describe("CurrencySwitcher keyboard navigation", () => {
  it("changes currency using keyboard controls", async () => {
    render(<CurrencySwitcher />);
    const user = userEvent.setup();

    await user.tab();
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    await screen.findByRole("option", { name: "USD" });

    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(setCurrencySpy).toHaveBeenCalledWith("EUR");
    expect(trigger).toHaveTextContent("EUR");
  });
});
