import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { PaginationDot } from "../PaginationDot";

describe("PaginationDot", () => {
  it("applies bg-primary when active", async () => {
    const { container } = render(<PaginationDot active />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");

  });

  it("uses bg-muted when inactive", () => {
    render(<PaginationDot active={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
  });
});
