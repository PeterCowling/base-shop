import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface LoadOpts {
  initialLoading?: boolean;
  reject?: boolean;
}

async function loadComp({
  initialLoading = false,
  reject = false,
}: LoadOpts = {}) {
  jest.resetModules();
  const deleteTransactionMock = jest.fn(async (_id: string) => {
    if (reject) {
      throw new Error("fail");
    }
  });
  jest.doMock("../../../hooks/mutations/useDeleteTransaction", () => {
     
    const React: typeof import("react") = require("react");
    const useDeleteTransaction = () => {
      const [loading, setLoading] = React.useState(initialLoading);
      const [error, setError] = React.useState<unknown>(null);
      const wrappedDelete = async (_id: string) => {
        setLoading(true);
        try {
          await deleteTransactionMock(_id);
        } catch (err) {
          setError(err);
          throw err;
        } finally {
          setLoading(false);
        }
      };
      return { deleteTransaction: wrappedDelete, loading, error };
    };
    return {
      __esModule: true,
      default: useDeleteTransaction,
    };
  });
  const mod = await import("../DeleteTransactionModal");
  return { Comp: mod.default, deleteTransactionMock };
}

const sampleTxn = { txnId: "t1", description: "Test", amount: 5 } as const;

describe("DeleteTransactionModal", () => {
  it("calls deleteTransaction then onClose", async () => {
    const { Comp, deleteTransactionMock } = await loadComp();
    const onClose = jest.fn();
    render(<Comp transaction={sampleTxn} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(deleteTransactionMock).toHaveBeenCalledWith("t1");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows error message when deletion fails", async () => {
    const { Comp } = await loadComp({ reject: true });
    render(<Comp transaction={sampleTxn} onClose={jest.fn()} />);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await userEvent.click(screen.getByRole("button", { name: /delete/i }));

      expect(
        await screen.findByText(/an error occurred while deleting/i)
      ).toBeInTheDocument();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("displays Deleting... when loading", async () => {
    const { Comp } = await loadComp({ initialLoading: true });
    render(<Comp transaction={sampleTxn} onClose={jest.fn()} />);

    expect(
      screen.getByRole("button", { name: /deleting.../i })
    ).toBeInTheDocument();
  });
});
