import "@testing-library/jest-dom";

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PaymentContextValue } from "../../../components/checkins/roomButton/PaymentContext";
import { PaymentContext } from "../../../components/checkins/roomButton/PaymentContext";
import SplitList from "../roomButton/SplitList";

function makeCtx(overrides: Partial<PaymentContextValue> = {}): PaymentContextValue {
  return {
    outstanding: 15,
    splitPayments: [
      { id: "1", amount: 10, payType: "CASH" },
      { id: "2", amount: 5, payType: "CC" },
    ],
    isDisabled: false,
    handleAmountChange: jest.fn(),
    handleSetPayType: jest.fn(),
    handleAddPaymentRow: jest.fn(),
    handleRemovePaymentRow: jest.fn(),
    handleImmediatePayment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("SplitList", () => {
  it("handles adding and removing rows", async () => {
    const handleAdd = jest.fn();
    const handleRemove = jest.fn();
    const ctx = makeCtx({ handleAddPaymentRow: handleAdd, handleRemovePaymentRow: handleRemove });

    const { container } = render(
      <PaymentContext.Provider value={ctx}>
        <SplitList />
      </PaymentContext.Provider>
    );

    const addBtn = container.querySelector('svg[data-icon="plus"]')?.parentElement as HTMLButtonElement;
    await userEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalled();

    const removeBtn = container.querySelector('svg[data-icon="trash-2"]')?.parentElement as HTMLButtonElement;
    await userEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(1);
  });
});
