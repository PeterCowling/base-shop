import React from "react";
import { render, screen } from "@testing-library/react";

import { PaginationDot } from "../src/components/atoms/PaginationDot";

describe("PaginationDot", () => {
  it("renders with active/inactive styles and custom size", () => {
    const { rerender } = render(<PaginationDot aria-label="dot" size="3" />);
    let btn = screen.getByRole("button", { name: "dot" });
    expect(btn.className).toMatch(/h-3/);
    expect(btn.className).toMatch(/bg-muted/);

    rerender(<PaginationDot aria-label="dot" active />);
    btn = screen.getByRole("button", { name: "dot" });
    expect(btn.className).toMatch(/bg-primary/);
  });
});

