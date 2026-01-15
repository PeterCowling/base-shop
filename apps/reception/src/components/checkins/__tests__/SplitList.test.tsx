/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SplitList from "../roomButton/SplitList";
import type { PaymentSplit } from "../../../types/component/roomButton/types";

describe("SplitList", () => {
  it("handles adding and removing rows", async () => {
    const handleAdd = vi.fn();
    const handleRemove = vi.fn();

    const splits: PaymentSplit[] = [
      { id: "1", amount: 10, payType: "CASH" },
      { id: "2", amount: 5, payType: "CC" },
    ];

    const { container } = render(
      <SplitList
        splitPayments={splits}
        isDisabled={false}
        handleAmountChange={vi.fn()}
        handleSetPayType={vi.fn()}
        handleAddPaymentRow={handleAdd}
        handleRemovePaymentRow={handleRemove}
      />
    );

    const addBtn = container.querySelector('svg[data-icon="plus"]')?.parentElement as HTMLButtonElement;
    await userEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalled();

    const removeBtn = container.querySelector('svg[data-icon="trash"]')?.parentElement as HTMLButtonElement;
    await userEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(1);
  });
});
