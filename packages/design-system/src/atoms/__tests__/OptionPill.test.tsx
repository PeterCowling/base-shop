import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { OptionPill } from "../OptionPill";

describe("OptionPill", () => {
  it("renders pressed state styles when selected", () => {
    render(<OptionPill selected>Selected</OptionPill>);
    const pill = screen.getByRole("button", { name: "Selected" });
    expect(pill).toHaveAttribute("aria-pressed", "true");
    expect(pill.className).toContain("border-border-3");
  });

  it("supports shape/radius overrides", () => {
    const { rerender } = render(<OptionPill shape="square">Square</OptionPill>);
    expect(screen.getByRole("button", { name: "Square" }).className).toContain("rounded-none");

    rerender(
      <OptionPill shape="square" radius="2xl">
        Square
      </OptionPill>,
    );
    expect(screen.getByRole("button", { name: "Square" }).className).toContain("rounded-2xl");
  });
});
