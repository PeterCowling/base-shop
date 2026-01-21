import { render, screen } from "@testing-library/react";

import { StatsGrid } from "../StatsGrid";

describe("StatsGrid", () => {
  it("renders StatCards and merges className", () => {
    const items = [
      { label: "Users", value: "123" },
      { label: "Sessions", value: "456" },
    ];

    const { container } = render(
      <StatsGrid items={items} className="custom-class" />
    );

    items.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    });

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "custom-class"
    );
  });
});
