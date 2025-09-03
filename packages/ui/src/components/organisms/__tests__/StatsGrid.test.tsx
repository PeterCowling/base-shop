import { render, screen } from "@testing-library/react";
import { StatsGrid } from "../StatsGrid";

describe("StatsGrid", () => {
  it("renders each StatCard and merges class names", () => {
    const items = [
      { label: "Visits", value: "1200" },
      { label: "Purchases", value: "300" },
    ];

    const { container } = render(
      <StatsGrid items={items} className="custom-class" />
    );

    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(String(item.value))).toBeInTheDocument();
    }

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "custom-class"
    );
  });
});
