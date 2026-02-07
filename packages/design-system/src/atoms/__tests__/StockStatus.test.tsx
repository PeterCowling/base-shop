import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { StockStatus } from "../StockStatus";

describe("StockStatus", () => {
  it("renders in-stock status", () => {
    render(<StockStatus inStock labelInStock="In stock" />);
    const span = screen.getByText("In stock");
    expect(span).toHaveClass("text-success");
    expect(span).toHaveAttribute("data-token", "--color-success");
  });

  it("renders out-of-stock status", () => {
    render(
      <StockStatus inStock={false} labelOutOfStock="Out of stock" />,
    );
    const span = screen.getByText("Out of stock");
    expect(span).toHaveClass("text-danger");
    expect(span).toHaveAttribute("data-token", "--color-danger");
  });

  it("renders custom labels and classes", () => {
    render(
      <>
        <StockStatus
          inStock
          labelInStock="Available"
          className="custom"
        />
        <StockStatus
          inStock={false}
          labelOutOfStock="Unavailable"
          className="custom"
        />
      </>
    );

    const inStock = screen.getByText("Available");
    expect(inStock).toHaveClass(
      "text-sm",
      "font-medium",
      "text-success",
      "custom",
    );
    expect(inStock).toHaveAttribute("data-token", "--color-success");

    const outOfStock = screen.getByText("Unavailable");
    expect(outOfStock).toHaveClass(
      "text-sm",
      "font-medium",
      "text-danger",
      "custom",
    );
    expect(outOfStock).toHaveAttribute("data-token", "--color-danger");
  });
});
