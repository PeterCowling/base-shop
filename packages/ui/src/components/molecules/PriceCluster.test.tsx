import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PriceCluster } from "./PriceCluster";

jest.mock("@platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("PriceCluster formatting", () => {
  it.each([
    {
      scenario: "without compare price",
      props: { price: 100 },
      expected: { price: "€100.00" },
    },
    {
      scenario: "with lower compare price",
      props: { price: 100, compare: 80 },
      expected: { price: "€100.00" },
    },
    {
      scenario: "with higher compare price",
      props: { price: 80, compare: 100 },
      expected: { price: "€80.00", compare: "€100.00", discount: "-20%" },
    },
  ])("$scenario", ({ props, expected }) => {
    render(<PriceCluster {...props} />);

    expect(screen.getByText(expected.price)).toBeInTheDocument();

    if (expected.compare) {
      expect(screen.getByText(expected.compare)).toBeInTheDocument();
      expect(screen.getByText(expected.discount!)).toBeInTheDocument();
    } else {
      if ("compare" in props) {
        expect(
          screen.queryByText(`€${props.compare!.toFixed(2)}`)
        ).toBeNull();
      }
      expect(screen.queryByText(/-\d+%/)).toBeNull();
    }
  });
});
