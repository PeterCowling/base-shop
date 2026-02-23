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

  it("supports indicator and selected-label shape/radius overrides", () => {
    const { rerender } = render(
      <OptionTile
        selected
        selectedLabel="Selected"
        indicatorShape="square"
        selectedLabelShape="square"
      >
        Choice
      </OptionTile>,
    );
    const tile = screen.getByRole("button", { name: /choice/i });
    let indicator = tile.querySelector("span[aria-hidden='true']");
    let selectedLabel = screen.getByText("Selected");
    expect(indicator).toHaveClass("rounded-none");
    expect(selectedLabel).toHaveClass("rounded-none");

    rerender(
      <OptionTile
        selected
        selectedLabel="Selected"
        indicatorShape="square"
        indicatorRadius="2xl"
        selectedLabelShape="square"
        selectedLabelRadius="xl"
      >
        Choice
      </OptionTile>,
    );
    indicator = screen.getByRole("button", { name: /choice/i }).querySelector("span[aria-hidden='true']");
    selectedLabel = screen.getByText("Selected");
    expect(indicator).toHaveClass("rounded-2xl");
    expect(selectedLabel).toHaveClass("rounded-xl");
  });
});
