import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  it("displays label and value", () => {
    render(<StatCard label="Orders" value="10" />);
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatCard label="Revenue" value="$100" className="custom" />,
    );
    expect(container.firstChild).toHaveClass("custom");
  });
});
