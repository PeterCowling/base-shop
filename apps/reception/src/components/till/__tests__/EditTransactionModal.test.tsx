import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Transaction } from "../../../types/component/Till";

interface Loaded {
  Comp: React.ComponentType<{ transaction: Transaction; onClose: () => void }>;
  editTransaction: jest.Mock;
}

async function loadComponent(error: unknown = null): Promise<Loaded> {
  jest.resetModules();
  const editTransaction = jest.fn();
  jest.doMock("../../../hooks/mutations/useEditTransaction", () => ({
    __esModule: true,
    default: () => ({ editTransaction, loading: false, error }),
  }));
  const mod = await import("../EditTransactionModal");
  return { Comp: mod.default, editTransaction };
}

describe("EditTransactionModal", () => {
  it("submits updated values", async () => {
    const { Comp, editTransaction } = await loadComponent();
    const onClose = jest.fn();
    const txn = {
      txnId: "t1",
      amount: 10,
      method: "cash",
      itemCategory: "bar",
      description: "beer",
    };
    render(<Comp transaction={txn} onClose={onClose} />);

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

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(editTransaction).toHaveBeenCalledWith("t1", {
      amount: 20,
      method: "card",
      itemCategory: "food",
      description: "lunch",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("displays error message when hook returns error", async () => {
    const { Comp } = await loadComponent(new Error("boom"));
    const txn = { txnId: "t1", amount: 10 };
    render(<Comp transaction={txn} onClose={jest.fn()} />);

    expect(
      screen.getByText(/an error occurred\. please try again\./i)
    ).toBeInTheDocument();
  });

  it("shows default values from transaction", async () => {
    const { Comp } = await loadComponent();
    const txn = {
      txnId: "t2",
      amount: 5.5,
      method: "card",
      itemCategory: "bar",
      description: "coke",
    };
    render(<Comp transaction={txn} onClose={jest.fn()} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue("5.5");
    expect(screen.getByLabelText(/method/i)).toHaveValue("card");
    expect(screen.getByLabelText(/item category/i)).toHaveValue("bar");
    expect(screen.getByLabelText(/description/i)).toHaveValue("coke");
  });
});
