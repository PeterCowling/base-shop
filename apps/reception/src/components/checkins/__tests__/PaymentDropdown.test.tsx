import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PaymentSplit } from "../../../types/component/roomButton/types";
import PaymentDropdown from "../roomButton/PaymentDropdown";

describe("PaymentDropdown", () => {
  it("triggers confirm payment", async () => {
    const handleImmediate = jest.fn().mockResolvedValue(undefined);
    const splits: PaymentSplit[] = [{ id: "1", amount: 10, payType: "CASH" }];

    render(
      <PaymentDropdown
        splitPayments={splits}
        handleAmountChange={jest.fn()}
        handleSetPayType={jest.fn()}
        handleAddPaymentRow={jest.fn()}
        handleRemovePaymentRow={jest.fn()}
        handleImmediatePayment={handleImmediate}
        isDisabled={false}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /confirm payment/i }));
    expect(handleImmediate).toHaveBeenCalled();
  });
});
