import React from "react";
import { render, screen } from "@testing-library/react";

import { StockStatus } from "../src/components/atoms/StockStatus";

describe("StockStatus", () => {
  it("shows in-stock label and tokens", () => {
    render(<StockStatus inStock />);
    const el = screen.getByText(/In stock/i);
    expect(el).toHaveAttribute("data-token", "--color-success");
    expect(el.className).toMatch(/text-success/);
  });

  it("shows out-of-stock label when false", () => {
    render(<StockStatus inStock={false} />);
    const el = screen.getByText(/Out of stock/i);
    expect(el).toHaveAttribute("data-token", "--color-danger");
    expect(el.className).toMatch(/text-danger/);
  });
});

