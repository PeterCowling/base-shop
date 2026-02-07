import { render, screen } from "@testing-library/react";

import { StatsGrid } from "../src/components/organisms/StatsGrid";

describe("StatsGrid", () => {
  it("renders items and merges className", () => {
    const items = [
      { label: "Users", value: "123" },
      { label: "Sessions", value: "456" },
    ];

    const { container } = render(
      <StatsGrid items={items} className="custom" />
    );

    items.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    });

    expect(container.firstChild).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "custom"
    );
  });
});
