import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PaymentContextValue } from "../../../components/checkins/roomButton/PaymentContext";
import { PaymentContext } from "../../../components/checkins/roomButton/PaymentContext";
import type { PaymentSplit } from "../../../types/component/roomButton/types";
import PaymentSplitRow from "../roomButton/PaymentSplitRow";

function makeCtx(overrides: Partial<PaymentContextValue> = {}): PaymentContextValue {
  return {
    outstanding: 5,
    splitPayments: [{ id: "1", amount: 5, payType: "CASH" }],
    isDisabled: false,
    handleAmountChange: jest.fn(),
    handleSetPayType: jest.fn(),
    handleAddPaymentRow: jest.fn(),
    handleRemovePaymentRow: jest.fn(),
    handleImmediatePayment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PaymentSplitRow", () => {
  it("handles amount change and pay type toggle", async () => {
    const handleAmountChange = jest.fn();
    const handleSetPayType = jest.fn();
    const ctx = makeCtx({ handleAmountChange, handleSetPayType });

    const split: PaymentSplit = { id: "1", amount: 5, payType: "CASH" };
    render(
      <PaymentContext.Provider value={ctx}>
        <PaymentSplitRow index={1} sp={split} />
      </PaymentContext.Provider>
    );

    const amountInput = screen.getByPlaceholderText("Amount");
    fireEvent.change(amountInput, { target: { value: "3" } });
    expect(handleAmountChange).toHaveBeenCalledWith(1, "3");

    await userEvent.click(screen.getByRole("button"));
    expect(handleSetPayType).toHaveBeenCalledWith(1, "CC");
  });
});
