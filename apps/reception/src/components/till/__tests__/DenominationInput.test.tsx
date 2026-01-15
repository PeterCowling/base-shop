import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DENOMINATIONS } from "../../../types/component/Till";
import { DenominationInput } from "../DenominationInput";

// helper counts for each denomination (same length as DENOMINATIONS)
const sampleCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("DenominationInput", () => {
  it("renders coins and notes with totals and handles changes", async () => {
    const handleChange = vi.fn();
    render(
      <DenominationInput
        denomCounts={sampleCounts}
        handleChange={handleChange}
        idPrefix="denomTest_"
      />
    );

    const coinsSection = screen.getByText("Coins").parentElement as HTMLElement;
    const notesSection = screen.getByText("Notes").parentElement as HTMLElement;
    const coinInputs = within(coinsSection).getAllByRole("textbox");
    const noteInputs = within(notesSection).getAllByRole("textbox");

    const numCoins = DENOMINATIONS.filter((d) => d.value <= 2).length;
    const numNotes = DENOMINATIONS.filter((d) => d.value > 2).length;
    expect(coinInputs.length).toBe(numCoins);
    expect(noteInputs.length).toBe(numNotes);

    // verify values and line totals from provided counts
    expect(screen.getByLabelText("€2 coins")).toHaveValue("6");
    expect(screen.getByLabelText("€20 notes")).toHaveValue("9");
    expect(screen.getByText("€12.00")).toBeInTheDocument();
    expect(screen.getByText("€180.00")).toBeInTheDocument();

    // change a value and ensure handler receives index and value
    const input = screen.getByLabelText("5c coins");
    await userEvent.clear(input);
    await userEvent.type(input, "3");
    expect(handleChange).toHaveBeenLastCalledWith(0, "3");
  });

  it("supports custom denomination lists", () => {
    const customDenoms = DENOMINATIONS.slice(-2);
    const counts = [1, 2];
    render(
      <DenominationInput
        denomCounts={counts}
        handleChange={vi.fn()}
        idPrefix="c_"
        denominations={customDenoms}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(customDenoms.length);
    expect(screen.getByLabelText(customDenoms[0].label)).toBeInTheDocument();
  });
});
