import { render, screen } from "@testing-library/react";
import { StockStatus } from "../src/components/atoms/StockStatus";

describe("StockStatus", () => {
  it("renders in-stock state with default classes", () => {
    render(<StockStatus inStock aria-label="availability" />);
    const span = screen.getByText("In stock");
    expect(span).toHaveClass("text-sm", "font-medium", "text-success");
    expect(span).toHaveAttribute("data-token", "--color-success");
    expect(screen.getByLabelText("availability")).toBe(span);
  });

  it("renders out-of-stock state", () => {
    render(<StockStatus inStock={false} />);
    const span = screen.getByText("Out of stock");
    expect(span).toHaveClass("text-sm", "font-medium", "text-danger");
    expect(span).toHaveAttribute("data-token", "--color-danger");
  });
});
