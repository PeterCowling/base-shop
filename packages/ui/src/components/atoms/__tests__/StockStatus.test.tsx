import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { StockStatus } from "../StockStatus";

describe("StockStatus", () => {
  it("renders in-stock state", () => {
    render(<StockStatus inStock />);
    const span = screen.getByText("In stock");
    expect(span).toHaveAttribute("data-token", "--color-success");
    expect(span).toHaveClass("text-success");
  });

  it("renders out-of-stock state", () => {
    render(<StockStatus inStock={false} />);
    const span = screen.getByText("Out of stock");
    expect(span).toHaveAttribute("data-token", "--color-danger");
    expect(span).toHaveClass("text-danger");
  });
});
