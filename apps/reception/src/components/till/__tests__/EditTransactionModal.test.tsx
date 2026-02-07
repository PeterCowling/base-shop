import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Transaction } from "../../../types/component/Till";
import EditTransactionModal from "../EditTransactionModal";

const correctTransaction = jest.fn();
let hookError: unknown = null;

jest.mock("../../../hoc/withModalBackground", () => ({
  withModalBackground: (Comp: React.ComponentType) => Comp,
}));

jest.mock("../../../hooks/mutations/useCorrectTransaction", () => ({
  __esModule: true,
  default: () => ({ correctTransaction, loading: false, error: hookError }),
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel?: string }) => (
    <button onClick={onSubmit}>{submitLabel ?? "Confirm"}</button>
  ),
}));

describe("EditTransactionModal", () => {
  beforeEach(() => {
    correctTransaction.mockReset();
    hookError = null;
  });

  it("submits updated values", async () => {
    const onClose = jest.fn();
    const txn = {
      txnId: "t1",
      amount: 10,
      method: "cash",
      itemCategory: "bar",
      description: "beer",
    };
    render(<EditTransactionModal transaction={txn} onClose={onClose} />);

    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "20");

    const methodInput = screen.getByLabelText(/method/i);
    await userEvent.clear(methodInput);
    await userEvent.type(methodInput, "card");

    const catInput = screen.getByLabelText(/item category/i);
    await userEvent.clear(catInput);
    await userEvent.type(catInput, "food");

    const descInput = screen.getByLabelText(/description/i);
    await userEvent.clear(descInput);
    await userEvent.type(descInput, "lunch");

    const reasonInput = screen.getByLabelText(/correction reason/i);
    await userEvent.type(reasonInput, "Fix typo");

    await userEvent.click(
      screen.getByRole("button", { name: /record correction/i })
    );

    expect(correctTransaction).toHaveBeenCalledWith(
      "t1",
      {
        amount: 20,
        method: "card",
        itemCategory: "food",
        description: "lunch",
      },
      "Fix typo"
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("displays error message when hook returns error", async () => {
    hookError = new Error("boom");
    const txn = { txnId: "t1", amount: 10 };
    render(<EditTransactionModal transaction={txn} onClose={jest.fn()} />);

    expect(
      screen.getByText(/an error occurred\. please try again\./i)
    ).toBeInTheDocument();
  });

  it("shows default values from transaction", async () => {
    const txn = {
      txnId: "t2",
      amount: 5.5,
      method: "card",
      itemCategory: "bar",
      description: "coke",
    };
    render(<EditTransactionModal transaction={txn} onClose={jest.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue("5.5");
    expect(screen.getByLabelText(/method/i)).toHaveValue("card");
    expect(screen.getByLabelText(/item category/i)).toHaveValue("bar");
    expect(screen.getByLabelText(/description/i)).toHaveValue("coke");
  });
});
