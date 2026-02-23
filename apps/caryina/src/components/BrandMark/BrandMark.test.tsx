import React from "react";
import { render, screen } from "@testing-library/react";

import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("renders the final static state when animation is disabled", () => {
    render(<BrandMark animate={false} />);

    const root = screen.getByRole("img", { name: "Carina" });
    expect(root).toHaveAttribute("data-state", "to");
    expect(
      screen.getByText("Un solo dettaglio. Quello carino.")
    ).toBeInTheDocument();
  });
});
