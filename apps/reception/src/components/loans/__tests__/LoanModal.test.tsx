import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock loan-related hooks for determinism
vi.mock("../../../hooks/data/useLoans", () => ({
  __esModule: true,
  default: () => ({ loans: {}, loading: false, error: null }),
}));
vi.mock("../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ loans: {}, loading: false, error: null }),
}));

import { LoanModal } from "../LoanModal";

const occupant = {
  guestId: "G1",
  bookingRef: "B1",
  firstName: "John",
  lastName: "Doe",
};

describe("LoanModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits count and deposit type", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <LoanModal
        isOpen
        mode="loan"
        occupant={occupant}
        item="Keycard"
        method="CASH"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    const countInput = screen.getByLabelText(/quantity to loan/i);
    await userEvent.clear(countInput);
    await userEvent.type(countInput, "3");

    await userEvent.selectOptions(
      screen.getByLabelText(/deposit method/i),
      "PASSPORT"
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(3, "PASSPORT");
    expect(onClose).toHaveBeenCalled();
  });

  it("enforces min and max for returns", async () => {
    const onConfirm = vi.fn();

    render(
      <LoanModal
        isOpen
        mode="return"
        item="Umbrella"
        maxCount={5}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const countInput = screen.getByLabelText(/quantity to return/i);
    expect(countInput).toHaveAttribute("min", "1");
    expect(countInput).toHaveAttribute("max", "5");

    await userEvent.clear(countInput);
    await userEvent.type(countInput, "3");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(3, "CASH");
  });
});

