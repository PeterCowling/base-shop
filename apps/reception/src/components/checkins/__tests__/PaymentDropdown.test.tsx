import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PaymentDropdown from "../roomButton/PaymentDropdown";
import type { PaymentSplit } from "../../../types/component/roomButton/types";

describe("PaymentDropdown", () => {
  it("triggers confirm and closes on mouse leave", async () => {
    const handleImmediate = jest.fn().mockResolvedValue(undefined);
    const setMenuOpen = jest.fn();
    const splits: PaymentSplit[] = [{ id: "1", amount: 10, payType: "CASH" }];

    const { container } = render(
      <PaymentDropdown
        menuOpen
        menuPosition={{ top: 0, left: 0 }}
        splitPayments={splits}
        handleAmountChange={jest.fn()}
        handleSetPayType={jest.fn()}
        handleAddPaymentRow={jest.fn()}
        handleRemovePaymentRow={jest.fn()}
        handleImmediatePayment={handleImmediate}
        isDisabled={false}
        setMenuOpen={setMenuOpen}
        setMenuPosition={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm payment/i }));
    expect(handleImmediate).toHaveBeenCalled();

    fireEvent.mouseLeave(container.firstChild as Element);
    expect(setMenuOpen).toHaveBeenCalledWith(false);
  });
});
