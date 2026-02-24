import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { PaginationDot } from "../PaginationDot";

describe("PaginationDot", () => {
  it("applies bg-primary when active", async () => {
    const { container } = render(<PaginationDot active />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");

  });

  it("uses bg-muted when inactive", () => {
    render(<PaginationDot active={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
  });

  it("supports shape/radius overrides", () => {
    const { rerender } = render(<PaginationDot shape="square" />);
    expect(screen.getByRole("button")).toHaveClass("rounded-none");

    rerender(<PaginationDot shape="square" radius="2xl" />);
    expect(screen.getByRole("button")).toHaveClass("rounded-2xl");
  });
});
