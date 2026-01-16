import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Transaction } from "../../../types/component/Till";

const sample: Transaction = { txnId: "t1", amount: 10 };

vi.mock("../DeleteTransactionModal", () => ({
  __esModule: true,
  default: ({
    onClose,
    transaction,
  }: { onClose: () => void; transaction: Transaction }) => (
    <div>
      <span>del-{transaction.txnId}</span>
      <button onClick={onClose}>close-del</button>
    </div>
  ),
}));

vi.mock("../EditTransactionModal", () => ({
  __esModule: true,
  default: ({
    onClose,
    transaction,
  }: { onClose: () => void; transaction: Transaction }) => (
    <div>
      <span>edit-{transaction.txnId}</span>
      <button onClick={onClose}>close-edit</button>
    </div>
  ),
}));

import TransactionModals from "../TransactionModals";

describe("TransactionModals", () => {
  it("renders delete modal and clears state on close", async () => {
    const setDel = vi.fn();
    render(
      <TransactionModals
        txnToDelete={sample}
        txnToEdit={null}
        setTxnToDelete={setDel}
        setTxnToEdit={vi.fn()}
      />
    );
    expect(screen.getByText("del-t1")).toBeInTheDocument();
    await userEvent.click(screen.getByText("close-del"));
    expect(setDel).toHaveBeenCalledWith(null);
  });

  it("renders edit modal and clears state on close", async () => {
    const setEdit = vi.fn();
    render(
      <TransactionModals
        txnToDelete={null}
        txnToEdit={sample}
        setTxnToDelete={vi.fn()}
        setTxnToEdit={setEdit}
      />
    );
    expect(screen.getByText("edit-t1")).toBeInTheDocument();
    await userEvent.click(screen.getByText("close-edit"));
    expect(setEdit).toHaveBeenCalledWith(null);
  });
});
