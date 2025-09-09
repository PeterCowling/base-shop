import { render, screen } from "@testing-library/react";
import { Price } from "../src/components/atoms/Price";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("Price", () => {
  it("formats amount with provided currency and applies class names", () => {
    render(<Price amount={1234.56} currency="USD" className="highlight" />);
    const span = screen.getByText("$1,234.56");
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass("highlight");
  });

  it("falls back to context currency when none provided and forwards aria-label", () => {
    render(<Price amount={1234.56} aria-label="price" />);
    const span = screen.getByLabelText("price");
    expect(span).toHaveTextContent("€1,234.56");
  });
});
