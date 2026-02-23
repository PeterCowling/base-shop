import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { OptionTile } from "../OptionTile";

describe("OptionTile", () => {
  it("renders selection label and pressed state", () => {
    render(
      <OptionTile selected selectedLabel="Selected">
        Choice
      </OptionTile>,
    );
    const tile = screen.getByRole("button", { name: /choice/i });
    expect(tile).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("supports shape/radius overrides", () => {
    const { rerender } = render(<OptionTile shape="square">Choice</OptionTile>);
    expect(screen.getByRole("button", { name: /choice/i }).className).toContain("rounded-none");

    rerender(
      <OptionTile shape="square" radius="xl">
        Choice
      </OptionTile>,
    );
    expect(screen.getByRole("button", { name: /choice/i }).className).toContain("rounded-xl");
  });
});
