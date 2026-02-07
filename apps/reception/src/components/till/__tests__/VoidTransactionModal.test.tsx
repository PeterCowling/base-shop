import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Transaction } from "../../../types/component/Till";
import VoidTransactionModal from "../VoidTransactionModal";

const sampleTxn: Transaction = { txnId: "t1", description: "Test", amount: 5 };

const voidTransactionMock = jest.fn();
let voidError: unknown = null;

jest.mock("../../../hooks/mutations/useVoidTransaction", () => ({
  __esModule: true,
  default: () => ({
    voidTransaction: voidTransactionMock,
    loading: false,
    error: voidError,
  }),
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel?: string }) => (
    <button onClick={onSubmit}>{submitLabel ?? "Confirm"}</button>
  ),
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

describe("VoidTransactionModal", () => {
  beforeEach(() => {
    voidTransactionMock.mockReset();
    voidError = null;
  });

  it("requires a reason and voids on reauth", async () => {
    const onClose = jest.fn();
    render(<VoidTransactionModal transaction={sampleTxn} onClose={onClose} />);

    await userEvent.type(screen.getByPlaceholderText(/why is this transaction/i), "Test reason");
    await userEvent.click(screen.getByRole("button", { name: /confirm void/i }));

    expect(voidTransactionMock).toHaveBeenCalledWith("t1", "Test reason");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error message when voiding fails", async () => {
    voidError = new Error("fail");
    render(<VoidTransactionModal transaction={sampleTxn} onClose={jest.fn()} />);

    expect(
      screen.getByText(/an error occurred while voiding/i)
    ).toBeInTheDocument();
  });
});
