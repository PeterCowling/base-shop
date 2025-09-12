import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StatsGrid } from "./StatsGrid";

describe("StatsGrid", () => {
  it("renders provided statistics in a grid layout", () => {
    const items = [
      { label: "Sales", value: "100" },
      { label: "Visitors", value: "200" },
      { label: "Revenue", value: "$300" },
    ];

    render(
      <StatsGrid
        items={items}
        className="custom"
        data-cy="stats-grid"
      />
    );

    const grid = screen.getByTestId("stats-grid");
    expect(grid).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "custom"
    );

    const cards = grid.querySelectorAll('[data-token="--color-bg"]');
    expect(cards).toHaveLength(items.length);

    items.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(String(value))).toBeInTheDocument();
    });
  });
});
