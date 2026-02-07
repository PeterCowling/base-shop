import { render, screen } from "@testing-library/react";

import MultiColumn from "../containers/MultiColumn";

describe("MultiColumn", () => {
  it("defaults to two columns with 1rem gap", () => {
    const { container } = render(<MultiColumn />);
    expect(container.firstChild).toHaveStyle({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "1rem",
    });
  });

  it("applies custom columns, gap, className, and renders children", () => {
    render(
      <MultiColumn columns={3} gap="2px" className="custom">
        <div>Child</div>
      </MultiColumn>
    );

    const wrapper = screen.getByText("Child").parentElement;
    expect(wrapper).toHaveClass("grid");
    expect(wrapper).toHaveClass("custom");
    expect(wrapper).toHaveStyle({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "2px",
    });
    expect(screen.getByText("Child")).toBeInTheDocument();
  });
});
