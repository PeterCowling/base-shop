import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CreditCardReceiptCheck } from "../CreditCardReceiptCheck";

/* eslint-disable no-var */
var confirmMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../hooks/mutations/useCCReceiptConfirmations", () => ({
  useCCReceiptConfirmations: () => ({ confirmReceipt: confirmMock }),
}));

beforeEach(() => {
  confirmMock = jest.fn();
});

const sampleTxns = [
  {
    txnId: "t1",
    amount: 10,
    description: "a",
    timestamp: "2024-01-01T00:00:00Z",
  },
  {
    txnId: "t2",
    amount: 20,
    description: "b",
    timestamp: "2024-01-02T00:00:00Z",
  },
];

const newTxns = [
  {
    txnId: "t3",
    amount: 5,
    description: "c",
    timestamp: "2024-01-03T00:00:00Z",
  },
  {
    txnId: "t4",
    amount: 7,
    description: "d",
    timestamp: "2024-01-04T00:00:00Z",
  },
];

describe("CreditCardReceiptCheck", () => {
  it("reports unconfirmed receipts only once on mount", async () => {
    const onChange = jest.fn();
    render(
      <CreditCardReceiptCheck
        transactions={sampleTxns}
        onCheckStatusChange={onChange}
      />
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  it("renders checkboxes for each transaction and notifies when all ticked", async () => {
    const onChange = jest.fn();
    const onMapChange = jest.fn();
    render(
      <CreditCardReceiptCheck
        transactions={sampleTxns}
        onCheckStatusChange={onChange}
        onMapChange={onMapChange}
      />
    );

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(sampleTxns.length);
    boxes.forEach((box) => expect(box).not.toBeChecked());
    expect(onChange).toHaveBeenLastCalledWith(false);

    await userEvent.click(boxes[0]);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onMapChange).toHaveBeenCalled();
    await userEvent.click(boxes[1]);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("calls mutation when receipt marked reconciled", async () => {
    render(
      <CreditCardReceiptCheck
        transactions={sampleTxns}
        onCheckStatusChange={jest.fn()}
      />
    );

    const boxes = screen.getAllByRole("checkbox");
    await userEvent.click(boxes[0]);
    expect(confirmMock).toHaveBeenCalledWith("t1");
  });

  it("resets selects when transactions prop changes", async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <CreditCardReceiptCheck
        transactions={sampleTxns}
        onCheckStatusChange={onChange}
      />
    );

    let boxes = screen.getAllByRole("checkbox");
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(
      <CreditCardReceiptCheck
        transactions={newTxns}
        onCheckStatusChange={onChange}
      />
    );

    await waitFor(() => {
      boxes = screen.getAllByRole("checkbox");
      expect(boxes).toHaveLength(newTxns.length);
      boxes.forEach((box) => expect(box).not.toBeChecked());
    });
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
