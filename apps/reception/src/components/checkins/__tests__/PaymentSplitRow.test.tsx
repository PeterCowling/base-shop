import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PaymentSplitRow from "../roomButton/PaymentSplitRow";
import type { PaymentSplit } from "../../../types/component/roomButton/types";

describe("PaymentSplitRow", () => {
  it("handles amount change and pay type toggle", async () => {
    const handleAmountChange = jest.fn();
    const handleSetPayType = jest.fn();

    const split: PaymentSplit = { id: "1", amount: 5, payType: "CASH" };
    render(
      <PaymentSplitRow
        index={1}
        sp={split}
        isDisabled={false}
        handleAmountChange={handleAmountChange}
        handleSetPayType={handleSetPayType}
        handleAddPaymentRow={jest.fn()}
        handleRemovePaymentRow={jest.fn()}
        showAddButton={false}
      />
    );

    const amountInput = screen.getByPlaceholderText("Amount");
    fireEvent.change(amountInput, { target: { value: "3" } });
    expect(handleAmountChange).toHaveBeenCalledWith(1, "3");

    await userEvent.click(screen.getByRole("button"));
    expect(handleSetPayType).toHaveBeenCalledWith(1, "CC");
  });
});
