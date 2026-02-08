import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { Separator } from "../separator";

describe("Separator", () => {
  // TC-01: Horizontal by default
  it("renders horizontal by default", () => {
    render(<Separator data-cy="sep" />);
    const el = screen.getByTestId("sep");
    expect(el).toHaveAttribute("data-orientation", "horizontal");
    expect(el).toHaveClass("h-[1px]", "w-full");
  });

  // TC-02: Vertical orientation
  it("renders vertical when orientation is vertical", () => {
    render(<Separator orientation="vertical" data-cy="sep" />);
    const el = screen.getByTestId("sep");
    expect(el).toHaveAttribute("data-orientation", "vertical");
    expect(el).toHaveClass("h-full", "w-[1px]");
  });

  // TC-03: Decorative by default (no ARIA role)
  it("is decorative by default (role=none)", () => {
    render(<Separator data-cy="sep" />);
    const el = screen.getByTestId("sep");
    expect(el).toHaveAttribute("role", "none");
  });

  // TC-04: Non-decorative has separator role
  it("has separator role when not decorative", () => {
    render(<Separator decorative={false} data-cy="sep" />);
    const el = screen.getByTestId("sep");
    expect(el).toHaveAttribute("role", "separator");
  });

  // TC-05: Custom className merges
  it("merges custom className", () => {
    render(<Separator className="my-4" data-cy="sep" />);
    const el = screen.getByTestId("sep");
    expect(el).toHaveClass("my-4");
    expect(el).toHaveClass("bg-border");
  });
});
