/* eslint-disable no-var */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// mock placeholders
var recordReconcile: ReturnType<typeof vi.fn>;
var recordBankDeposit: ReturnType<typeof vi.fn>;
var recordBankWithdrawal: ReturnType<typeof vi.fn>;
var updateCount: ReturnType<typeof vi.fn>;
var runTransactionMock: ReturnType<typeof vi.fn>;
var safeError: unknown;
var showToastMock: ReturnType<typeof vi.fn>;
var bankDepositArgs: [number, number, number];

vi.mock("../../../hooks/useSafeLogic", () => {
  recordReconcile = vi.fn();
  recordBankDeposit = vi.fn();
  recordBankWithdrawal = vi.fn();
  safeError = null;
  return {
    useSafeLogic: () => ({
      safeBalance: 100,
      recordReconcile,
      recordPettyWithdrawal: vi.fn(),
      recordBankDeposit,
      recordBankWithdrawal,
      error: safeError,
    }),
  };
});

vi.mock("../../../hooks/data/useSafeKeycardCount", () => {
  updateCount = vi.fn();
  return { useSafeKeycardCount: () => ({ count: 2, updateCount }) };
});

vi.mock("../../../utils/transaction", () => {
  runTransactionMock = vi.fn(async (steps) => {
    const completed: typeof steps = [];
    for (const step of steps) {
      try {
        await step.run();
        completed.push(step);
      } catch (error) {
        for (const s of completed.reverse()) {
          await s.rollback?.();
        }
        throw error;
      }
    }
  });
  return { runTransaction: (steps: any) => runTransactionMock(steps) };
});

vi.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

vi.mock("../SafeReconcileForm", () => ({
  __esModule: true,
  SafeReconcileForm: ({
    onConfirm,
  }: {
    onConfirm: (...args: unknown[]) => void;
  }) => (
    <button onClick={() => onConfirm(200, 0, 4, 0, { "50": 4 })}>
      reconcile-form
    </button>
  ),
  default: ({ onConfirm }: { onConfirm: (...args: unknown[]) => void }) => (
    <button onClick={() => onConfirm(200, 0, 4, 0, { "50": 4 })}>
      reconcile-form
    </button>
  ),
}));

vi.mock("../BankDepositForm", () => ({
  __esModule: true,
  BankDepositForm: ({
    onConfirm,
  }: {
    onConfirm: (...args: unknown[]) => void;
    currentKeycards: number;
  }) => (
    <button onClick={() => onConfirm(...bankDepositArgs)}>
      bank-deposit-form
    </button>
  ),
  default: ({
    onConfirm,
  }: {
    onConfirm: (...args: unknown[]) => void;
    currentKeycards: number;
  }) => (
    <button onClick={() => onConfirm(...bankDepositArgs)}>
      bank-deposit-form
    </button>
  ),
}));

import SafeReconciliation from "../SafeReconciliation";
import { SafeDataProvider } from "../../../context/SafeDataContext";

describe("SafeReconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordReconcile = vi.fn();
    recordBankDeposit = vi.fn();
    recordBankWithdrawal = vi.fn();
    updateCount = vi.fn();
    bankDepositArgs = [40, 3, 1];
    runTransactionMock.mockImplementation(async (steps) => {
      const completed: typeof steps = [];
      for (const step of steps) {
        try {
          await step.run();
          completed.push(step);
        } catch (error) {
          for (const s of completed.reverse()) {
            await s.rollback?.();
          }
          throw error;
        }
      }
    });
    showToastMock = vi.fn();
    safeError = null;
  });
  it("displays the expected safe balance", () => {
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });
    const balance = screen.getByText(/Expected Balance:/i);
    expect(balance).toHaveTextContent("€100.00");
  });

  it("stores keycard count on reconciliation", async () => {
    recordReconcile.mockResolvedValueOnce(undefined);
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(
      screen.getByRole("button", { name: /reconcile safe/i })
    );
    await userEvent.click(screen.getByText("reconcile-form"));

    expect(recordReconcile).toHaveBeenCalledWith(
      200,
      0,
      4,
      0,
      { "50": 4 }
    );
    await waitFor(() => expect(updateCount).toHaveBeenCalledWith(4));
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces errors when reconciliation fails", async () => {
    recordReconcile.mockRejectedValueOnce(new Error("fail"));
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(
      screen.getByRole("button", { name: /reconcile safe/i })
    );
    await userEvent.click(screen.getByText("reconcile-form"));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("fail", "error")
    );
    expect(updateCount).toHaveBeenNthCalledWith(1, 4);
    expect(updateCount).toHaveBeenNthCalledWith(2, 2);
  });

  it("records bank deposit and updates keycards", async () => {
    recordBankDeposit.mockResolvedValueOnce(undefined);
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(screen.getByRole("button", { name: /bank deposit/i }));
    await userEvent.click(screen.getByText("bank-deposit-form"));

    expect(recordBankDeposit).toHaveBeenCalledWith(40, 3, 1);
    await waitFor(() => expect(updateCount).toHaveBeenCalledWith(3));
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("updates keycards even when the count is unchanged", async () => {
    bankDepositArgs = [40, 3, 0];
    recordBankDeposit.mockResolvedValueOnce(undefined);
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(screen.getByRole("button", { name: /bank deposit/i }));
    await userEvent.click(screen.getByText("bank-deposit-form"));

    expect(recordBankDeposit).toHaveBeenCalledWith(40, 3, 0);
    await waitFor(() => expect(updateCount).toHaveBeenCalledWith(3));
  });

  it("waits for keycard update before closing the modal", async () => {
    let resolveUpdate: (() => void) | undefined;
    updateCount.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        })
    );
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(screen.getByRole("button", { name: /bank deposit/i }));
    await userEvent.click(screen.getByText("bank-deposit-form"));

    expect(screen.getByText("bank-deposit-form")).toBeInTheDocument();

    resolveUpdate?.();

    await waitFor(() =>
      expect(screen.queryByText("bank-deposit-form")).not.toBeInTheDocument()
    );
  });

  it("rolls back bank deposit when keycard update fails", async () => {
    recordBankDeposit.mockResolvedValueOnce(undefined);
    updateCount.mockImplementationOnce(() => Promise.reject(new Error("fail")));
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await userEvent.click(screen.getByRole("button", { name: /bank deposit/i }));
    await userEvent.click(screen.getByText("bank-deposit-form"));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("fail", "error")
    );
    expect(recordBankDeposit).toHaveBeenCalledWith(40, 3, 1);
    expect(recordBankWithdrawal).toHaveBeenCalledWith(40);
    expect(updateCount).toHaveBeenCalledWith(3);
  });

  it("shows toast when safe logic errors without blocking interface", async () => {
    safeError = new Error("boom");
    render(<SafeReconciliation />, { wrapper: SafeDataProvider });

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("boom", "error")
    );
    const balance = screen.getByText(/Expected Balance:/i);
    expect(balance).toHaveTextContent("€100.00");
    expect(
      screen.getByRole("button", { name: /reconcile safe/i })
    ).toBeInTheDocument();
  });
});
