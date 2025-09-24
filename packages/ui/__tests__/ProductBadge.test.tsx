import React from "react";
import { render, screen } from "@testing-library/react";
import { ProductBadge } from "../src/components/atoms/ProductBadge";

describe("ProductBadge", () => {
  it("applies variant tokens and classes", () => {
    const { rerender } = render(<ProductBadge label="Sale" variant="sale" />);
    let outer = screen.getByText("Sale").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-danger");
    expect(outer.className).toMatch(/bg-danger/);
    expect(screen.getByText("Sale")).toHaveAttribute("data-token", "--color-danger-fg");

    rerender(<ProductBadge label="New" variant="new" />);
    outer = screen.getByText("New").parentElement as HTMLElement;
    expect(outer).toHaveAttribute("data-token", "--color-success");
  });
});

