import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PriceCluster } from "../PriceCluster";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("PriceCluster", () => {
  it("renders price without discount when compare is missing or lower", () => {
    const { rerender } = render(<PriceCluster price={100} />);

    expect(screen.getByText("€100.00")).toBeInTheDocument();
    expect(screen.queryByText(/-\d+%/)).toBeNull();

    rerender(<PriceCluster price={100} compare={80} />);

    expect(screen.getByText("€100.00")).toBeInTheDocument();
    expect(screen.queryByText("€80.00")).toBeNull();
    expect(screen.queryByText(/-\d+%/)).toBeNull();
  });

  it("shows compare price and discount badge when compare is greater than price", () => {
    render(<PriceCluster price={80} compare={100} />);

    expect(screen.getByText("€80.00")).toBeInTheDocument();
    expect(screen.getByText("€100.00")).toBeInTheDocument();
    expect(screen.getByText("-20%"))
      .toBeInTheDocument();
  });
});
