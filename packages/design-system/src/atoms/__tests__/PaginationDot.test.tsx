import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { PaginationDot } from "../PaginationDot";

describe("PaginationDot", () => {
  it("applies bg-primary when active", () => {
    render(<PaginationDot active />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
  });

  it("uses bg-muted when inactive", () => {
    render(<PaginationDot active={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
  });
});
