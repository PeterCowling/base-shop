import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

// Mock loan-related hooks for determinism
vi.mock("../../../hooks/data/useLoans", () => ({
  __esModule: true,
  default: () => ({ loans: {}, loading: false, error: null }),
}));
vi.mock("../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ loans: {}, loading: false, error: null }),
}));

import DateSel from "../DateSel";
import { formatDateForInput } from "../../../utils/dateUtils";

describe("DateSel", () => {
  it("calls onDateChange for quick selections", async () => {
    const onDateChange = vi.fn();
    render(<DateSel selectedDate="" onDateChange={onDateChange} username="user" />);

    const base = new Date();
    const today = formatDateForInput(base);
    const yesterday = formatDateForInput(
      new Date(base.getTime() - 86400000)
    );

    await userEvent.click(screen.getByRole("button", { name: /today/i }));
    expect(onDateChange).toHaveBeenLastCalledWith(today);

    await userEvent.click(screen.getByRole("button", { name: /yesterday/i }));
    expect(onDateChange).toHaveBeenLastCalledWith(yesterday);
  });
});

