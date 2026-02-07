import React from "react";
import { render, screen } from "@testing-library/react";

import IconButton from "../src/components/atoms/IconButton";

describe("IconButton", () => {
  it("applies variant and size classes with tokens", () => {
    const { rerender } = render(
      <IconButton aria-label="icon" variant="primary" size="md" />
    );
    const btn = screen.getByRole("button", { name: "icon" });
    expect(btn).toHaveAttribute("data-token", "--color-primary");
    expect(btn.className).toMatch(/h-10/);

    rerender(<IconButton aria-label="icon" variant="danger" size="sm" />);
    const btn2 = screen.getByRole("button", { name: "icon" });
    expect(btn2).toHaveAttribute("data-token", "--color-danger");
    expect(btn2.className).toMatch(/h-8/);
  });

  it("defaults type=button", () => {
    render(<IconButton aria-label="icon2" />);
    expect(screen.getByRole("button", { name: "icon2" })).toHaveAttribute(
      "type",
      "button"
    );
  });
});
