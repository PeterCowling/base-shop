import React from "react";
import { render, screen } from "@testing-library/react";
import { Grid } from "../src/components/atoms/primitives/Grid";

describe("Grid primitive", () => {
  it("renders with default column and gap classes", () => {
    render(<Grid data-cy="grid" />);
    const grid = screen.getByTestId("grid");
    expect(grid.className).toContain("grid");
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("gap-4");
  });

  it("merges custom column, gap, and className values", () => {
    render(
      <Grid data-testid="grid" cols={5} gap={1} className="bg-muted" aria-label="layout" />
    );
    const grid = screen.getByLabelText("layout");
    expect(grid.className).toContain("grid-cols-5");
    expect(grid.className).toContain("gap-1");
    expect(grid.className).toContain("bg-muted");
  });
});
