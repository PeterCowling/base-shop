/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PaymentDropdown from "../roomButton/PaymentDropdown";
import type { PaymentSplit } from "../../../types/component/roomButton/types";

describe("PaymentDropdown", () => {
  it("triggers confirm and closes on mouse leave", async () => {
    const handleImmediate = vi.fn().mockResolvedValue(undefined);
    const setMenuOpen = vi.fn();
    const splits: PaymentSplit[] = [{ id: "1", amount: 10, payType: "CASH" }];

    const { container } = render(
      <PaymentDropdown
        menuOpen
        menuPosition={{ top: 0, left: 0 }}
        splitPayments={splits}
        handleAmountChange={vi.fn()}
        handleSetPayType={vi.fn()}
        handleAddPaymentRow={vi.fn()}
        handleRemovePaymentRow={vi.fn()}
        handleImmediatePayment={handleImmediate}
        isDisabled={false}
        setMenuOpen={setMenuOpen}
        setMenuPosition={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm payment/i }));
    expect(handleImmediate).toHaveBeenCalled();

    fireEvent.mouseLeave(container.firstChild as Element);
    expect(setMenuOpen).toHaveBeenCalledWith(false);
  });
});
