import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Price } from "../Price";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("Price", () => {
  it("formats amount with provided currency", () => {
    render(<Price amount={1234.56} currency="USD" />);
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("falls back to context currency when none provided", () => {
    render(<Price amount={1234.56} />);
    expect(screen.getByText("€1,234.56")).toBeInTheDocument();
  });
});
