import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import VarianceHeatMap from "../VarianceHeatMap";

jest.mock("../../../hooks/data/useCashCountsData", () => ({
  useCashCountsData: () => ({
    cashCounts: [
      { user: "Alice", timestamp: "2024-01-01T00:00:00Z", type: "close", difference: 2 },
      { user: "Bob", timestamp: "2024-01-02T00:00:00Z", type: "close", difference: -1 },
    ],
    loading: false,
    error: null,
  }),
}));

describe("VarianceHeatMap", () => {
  it("applies dark mode classes", () => {
    const { container } = render(
      <div className="dark">
        <VarianceHeatMap />
      </div>
    );
    const table = container.querySelector("table");
    expect(table).toHaveClass("dark:bg-darkSurface");
  });
});
