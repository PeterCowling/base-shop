// src/components/safe/__tests__/SafeManagement.test.tsx
/* eslint-disable no-var */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { AuthContext } from "../../../context/AuthContext";
import type { SafeCount } from "../../../types/hooks/data/safeCountData";
import type { User } from "../../../types/domains/userDomain";

// placeholders for mocks
var updateCount: jest.Mock;
var returnKeycardsToSafe: jest.Mock;
var recordKeycardTransfer: jest.Mock;
var addCashCount: jest.Mock;
var recordFloatEntry: jest.Mock;
var showToastMock: jest.Mock;
var exchangeDirection: "drawerToSafe" | "safeToDrawer";

jest.mock("../../../hooks/data/useSafeKeycardCount", () => ({
  useSafeKeycardCount: () => ({ count: 0, updateCount }),
}));

jest.mock("../../../hooks/client/till/useTillShiftActions", () => ({
  useTillShiftActions: () => ({ returnKeycardsToSafe }),
}));

jest.mock("../../../hooks/useKeycardTransfer", () => ({
  useKeycardTransfer: () => recordKeycardTransfer,
}));

jest.mock("../../../hooks/useCashCounts", () => ({
  useCashCounts: () => ({ addCashCount, recordFloatEntry }),
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));


// --- Hoist-safe mock placeholders -----------------------------
// NB: use `var`, not `let`, to avoid the Temporal Dead Zone error
var recordDeposit: jest.Mock;
var recordWithdrawal: jest.Mock;
var recordExchange: jest.Mock;
var recordOpening: jest.Mock;
var recordReconcile: jest.Mock;
var recordReset: jest.Mock;
var recordBankDeposit: jest.Mock;
var recordBankWithdrawal: jest.Mock;
var recordPettyWithdrawal: jest.Mock;
var safeError: unknown;
// --------------------------------------------------------------

const defaultSafeCounts: SafeCount[] = [
  {
    id: "1",
    user: "u1",
    timestamp: "2024-01-01T10:00:00Z",
    type: "deposit",
    amount: 100,
  },
  {
    id: "2",
    user: "u2",
    timestamp: "2024-01-02T12:00:00Z",
    type: "withdrawal",
    amount: 50,
  },
  {
    id: "3",
    user: "u3",
    timestamp: "2024-01-03T09:00:00Z",
    type: "safeReset",
    count: 200,
    keycardCount: 5,
  },
];

var safeCounts: SafeCount[] = [...defaultSafeCounts];

jest.mock("../../../hooks/useSafeLogic", () => {
  // initialise mock fns inside the hoisted factory
  recordDeposit = jest.fn();
  recordWithdrawal = jest.fn();
  recordExchange = jest.fn();
  recordOpening = jest.fn();
  recordReconcile = jest.fn();
  recordReset = jest.fn();
  recordBankDeposit = jest.fn();
  recordBankWithdrawal = jest.fn();
  recordPettyWithdrawal = jest.fn();
  safeError = null;

  return {
    useSafeLogic: () => ({
      safeCounts,
      safeBalance: 50,
      recordDeposit,
      recordWithdrawal,
      recordExchange,
      recordOpening,
      recordReconcile,
      recordReset,
      recordBankDeposit,
      recordBankWithdrawal,
      recordPettyWithdrawal,
      error: safeError,
    }),
  };
});

jest.mock("../SafeDepositForm", () => ({
  __esModule: true,
  SafeDepositForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
    currentKeycards?: number;
  }) => (
    <div>
      <button onClick={() => onConfirm(10, 1, 1, { a: 1 })}>deposit-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
    currentKeycards?: number;
  }) => (
    <div>
      <button onClick={() => onConfirm(10, 1, 1, { a: 1 })}>deposit-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../SafeOpenForm", () => ({
  __esModule: true,
  SafeOpenForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(100, 3)}>open-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(100, 3)}>open-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../SafeWithdrawalForm", () => ({
  __esModule: true,
  SafeWithdrawalForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => void onConfirm(20, { "10": 2 })}>withdraw-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => void onConfirm(20, { "10": 2 })}>withdraw-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../BankDepositForm", () => ({
  __esModule: true,
  BankDepositForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
    currentKeycards: number;
  }) => (
    <div>
      <button onClick={() => onConfirm(40, 2, 1)}>bank-deposit-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
    currentKeycards: number;
  }) => (
    <div>
      <button onClick={() => onConfirm(40, 2, 1)}>bank-deposit-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../PettyCashForm", () => ({
  __esModule: true,
  PettyCashForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(15)}>petty-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(15)}>petty-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../../till/ExchangeNotesForm", () => ({
  __esModule: true,
  ExchangeNotesForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm({ a: 1 }, { b: 2 }, exchangeDirection, 30)}>
        exchange-form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm({ a: 1 }, { b: 2 }, exchangeDirection, 30)}>
        exchange-form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../SafeResetForm", () => ({
  __esModule: true,
  SafeResetForm: ({
    currentKeycards,
    onConfirm,
    onCancel,
  }: {
    currentKeycards: number;
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(300, 5, 5 - currentKeycards, { "50": 6 })}>
        reset-form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    currentKeycards,
    onConfirm,
    onCancel,
  }: {
    currentKeycards: number;
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(300, 5, 5 - currentKeycards, { "50": 6 })}>
        reset-form
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../SafeReconcileForm", () => ({
  __esModule: true,
  SafeReconcileForm: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(200, 0, 4, 0, { "50": 4 })}>reconcile-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(200, 0, { "50": 4 })}>reconcile-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock("../../till/ReturnKeycardsModal", () => ({
  __esModule: true,
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (...args: unknown[]) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(2)}>return-form</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { SafeDataProvider } from "../../../context/SafeDataContext";
import SafeManagement from "../SafeManagement";

const authValue: {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
} = {
  user: { email: "pete@example.com", user_name: "pete" },
  setUser: jest.fn(),
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={authValue}>
    <SafeDataProvider>{children}</SafeDataProvider>
  </AuthContext.Provider>
);

describe("SafeManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateCount = jest.fn();
    returnKeycardsToSafe = jest.fn(() => true);
    recordKeycardTransfer = jest.fn().mockResolvedValue(undefined);
    addCashCount = jest.fn();
    recordFloatEntry = jest.fn();
    recordBankDeposit = jest.fn();
    recordPettyWithdrawal = jest.fn();
    showToastMock = jest.fn();
    safeError = null;
    exchangeDirection = "drawerToSafe";
  });

  it("displays the current safe balance", () => {
    safeCounts = [...defaultSafeCounts];
    render(<SafeManagement />, { wrapper });
    const balance = screen.getByText(/Safe Balance:/);
    expect(balance).toHaveTextContent("€50.00");
  });

  it("falls back to timestamp-index key when id missing to avoid duplicates", () => {
    safeCounts = [
      {
        user: "u1",
        timestamp: "2024-01-01T10:00:00Z",
        type: "deposit",
        amount: 10,
      },
      {
        user: "u2",
        timestamp: "2024-01-01T10:00:00Z",
        type: "withdrawal",
        amount: 20,
      },
    ];
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    render(<SafeManagement />, { wrapper });
    const hasDuplicateKeyWarning = errorSpy.mock.calls.some((call) =>
      String(call[0]).includes("Each child in a list should have a unique \"key\" prop")
    );
    expect(hasDuplicateKeyWarning).toBe(false);
    errorSpy.mockRestore();
  });

  it("toggles forms and records transactions", async () => {
    safeCounts = [...defaultSafeCounts];

    render(<SafeManagement />, { wrapper });

    // table shows provided counts
    expect(
      screen.queryByRole("button", { name: /open reset form/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("safeReset")).toBeInTheDocument();

    // deposit
    await userEvent.click(
      screen.getByRole("button", { name: /^deposit$/i })
    );
    const dep = screen.getByText("deposit-form");
    await userEvent.click(dep);
    expect(recordDeposit).toHaveBeenCalledWith(10, 1, 1, { a: 1 });
    expect(addCashCount).toHaveBeenNthCalledWith(1, "tenderRemoval", 0, 0, 10);
    expect(updateCount).toHaveBeenNthCalledWith(1, 1);
    expect(screen.queryByText("deposit-form")).not.toBeInTheDocument();

    // withdrawal
    await userEvent.click(screen.getByRole("button", { name: /withdraw/i }));
    const w = screen.getByText("withdraw-form");
    await userEvent.click(w);
    expect(recordWithdrawal).toHaveBeenCalledWith(
      20,
      { "10": 2 }
    );
    expect(recordFloatEntry).toHaveBeenNthCalledWith(1, 20);
    expect(screen.queryByText("withdraw-form")).not.toBeInTheDocument();

    // exchange
    await userEvent.click(screen.getByRole("button", { name: /exchange/i }));
    const ex = screen.getByText("exchange-form");
    await userEvent.click(ex);
    expect(recordExchange).toHaveBeenCalledWith(
      { a: 1 },
      { b: 2 },
      "drawerToSafe",
      30
    );
    expect(addCashCount).toHaveBeenNthCalledWith(2, "tenderRemoval", 0, 0, 30);
    expect(recordFloatEntry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("exchange-form")).not.toBeInTheDocument();

    // bank deposit (safe only)
    await userEvent.click(
      screen.getByRole("button", { name: /bank deposit/i })
    );
    const bd = screen.getByText("bank-deposit-form");
    await userEvent.click(bd);
    expect(recordBankDeposit).toHaveBeenCalledWith(40, 2, 1);
    expect(updateCount).toHaveBeenNthCalledWith(2, 1);
    expect(screen.queryByText("bank-deposit-form")).not.toBeInTheDocument();

    // petty cash withdrawal (safe only)
    await userEvent.click(screen.getByRole("button", { name: /petty cash/i }));
    const pc = screen.getByText("petty-form");
    await userEvent.click(pc);
    expect(recordPettyWithdrawal).toHaveBeenCalledWith(15);
    expect(screen.queryByText("petty-form")).not.toBeInTheDocument();

    // reset safe
    await userEvent.click(screen.getByRole("button", { name: /reset safe/i }));
    const rs = screen.getByText("reset-form");
    await userEvent.click(rs);
    expect(recordReset).toHaveBeenCalledWith(300, 5, 5, { "50": 6 });
    expect(updateCount).toHaveBeenNthCalledWith(3, 5);
    expect(screen.queryByText("reset-form")).not.toBeInTheDocument();

    // return keycards
    await userEvent.click(
      screen.getByRole("button", { name: /return keycards/i })
    );
    const ret = screen.getByText("return-form");
    await userEvent.click(ret);
    expect(returnKeycardsToSafe).toHaveBeenCalledWith(2);
    expect(updateCount).toHaveBeenNthCalledWith(4, 2);
    expect(recordKeycardTransfer).toHaveBeenCalledWith(2, "toSafe");
    expect(screen.queryByText("return-form")).not.toBeInTheDocument();

    // reconcile
    await userEvent.click(screen.getByRole("button", { name: /reconcile/i }));
    const rec = screen.getByText("reconcile-form");
    await userEvent.click(rec);
    expect(recordReconcile).toHaveBeenCalledWith(
      200,
      0,
      4,
      0,
      { "50": 4 }
    );
    expect(updateCount).toHaveBeenNthCalledWith(5, 4);
    expect(screen.queryByText("reconcile-form")).not.toBeInTheDocument();
  });

  it("records float entry for safe-to-drawer exchange", async () => {
    safeCounts = [...defaultSafeCounts];
    exchangeDirection = "safeToDrawer";
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /exchange/i }));
    const ex = screen.getByText("exchange-form");
    await userEvent.click(ex);

    expect(recordExchange).toHaveBeenCalledWith(
      { a: 1 },
      { b: 2 },
      "safeToDrawer",
      30
    );
    expect(recordFloatEntry).toHaveBeenCalledWith(30);
    expect(addCashCount).not.toHaveBeenCalled();
    expect(screen.queryByText("exchange-form")).not.toBeInTheDocument();
  });

  it("rolls back drawer-to-safe exchange when tender removal fails", async () => {
    safeCounts = [...defaultSafeCounts];
    exchangeDirection = "drawerToSafe";
    addCashCount.mockRejectedValueOnce(new Error("fail"));
    recordExchange.mockResolvedValueOnce(undefined);
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /exchange/i }));
    const ex = screen.getByText("exchange-form");
    await userEvent.click(ex);

    await waitFor(() =>
      expect(recordExchange).toHaveBeenCalledWith(
        { a: 1 },
        { b: 2 },
        "drawerToSafe",
        30
      )
    );
    expect(recordExchange).toHaveBeenCalledWith(
      { b: 2 },
      { a: 1 },
      "safeToDrawer",
      30
    );
    expect(addCashCount).toHaveBeenNthCalledWith(
      1,
      "tenderRemoval",
      0,
      0,
      30
    );
    expect(addCashCount).toHaveBeenCalledTimes(1);
    expect(recordFloatEntry).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record exchange.",
      "error"
    );
    expect(screen.getByText("exchange-form")).toBeInTheDocument();
  });

  it("rolls back safe-to-drawer exchange when float entry fails", async () => {
    safeCounts = [...defaultSafeCounts];
    exchangeDirection = "safeToDrawer";
    recordFloatEntry.mockRejectedValueOnce(new Error("fail"));
    recordExchange.mockResolvedValueOnce(undefined);
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /exchange/i }));
    const ex = screen.getByText("exchange-form");
    await userEvent.click(ex);

    await waitFor(() =>
      expect(recordExchange).toHaveBeenCalledWith(
        { a: 1 },
        { b: 2 },
        "safeToDrawer",
        30
      )
    );
    expect(recordExchange).toHaveBeenCalledWith(
      { b: 2 },
      { a: 1 },
      "drawerToSafe",
      30
    );
    expect(recordFloatEntry).toHaveBeenCalledWith(30);
    expect(recordFloatEntry).toHaveBeenCalledTimes(1);
    expect(addCashCount).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record exchange.",
      "error"
    );
    expect(screen.getByText("exchange-form")).toBeInTheDocument();
  });

  it("shows empty state when no transactions", () => {
    safeCounts = [];
    render(<SafeManagement />, { wrapper });
    expect(screen.getByText("No transactions recorded.")).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /safe transactions/i })
    ).not.toBeInTheDocument();
  });

  it("hides forms when canceled without recording", async () => {
    render(<SafeManagement />, { wrapper });

    await userEvent.click(
      screen.getByRole("button", { name: /^deposit$/i })
    );
    expect(screen.getByText("deposit-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("deposit-form")).not.toBeInTheDocument();
    expect(recordDeposit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /withdraw/i }));
    expect(screen.getByText("withdraw-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("withdraw-form")).not.toBeInTheDocument();
    expect(recordWithdrawal).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /bank deposit/i }));
    expect(screen.getByText("bank-deposit-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("bank-deposit-form")).not.toBeInTheDocument();
    expect(recordBankDeposit).not.toHaveBeenCalled();
    expect(updateCount).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /petty cash/i }));
    expect(screen.getByText("petty-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("petty-form")).not.toBeInTheDocument();
    expect(recordPettyWithdrawal).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /reset safe/i }));
    expect(screen.getByText("reset-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("reset-form")).not.toBeInTheDocument();
    expect(recordReset).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: /return keycards/i })
    );
    expect(screen.getByText("return-form")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("return-form")).not.toBeInTheDocument();
    expect(returnKeycardsToSafe).not.toHaveBeenCalled();
  });

  it("displays count and keycard differences when provided", () => {
    safeCounts = [
      {
        id: "1",
        user: "u1",
        timestamp: "2024-01-03T10:00:00Z",
        type: "safeReconcile",
        count: 1000,
        difference: 0,
        keycardCount: 5,
        keycardDifference: -1,
      },
    ];
    render(<SafeManagement />, { wrapper });
    expect(screen.getByText("€1000.00 (+0.00)")).toBeInTheDocument();
    expect(screen.getByText("5 (-1)")).toBeInTheDocument();
  });

  it("omits difference when not provided", () => {
    safeCounts = [
      {
        id: "1",
        user: "u1",
        timestamp: "2024-01-01T10:00:00Z",
        type: "opening",
        count: 100,
        keycardCount: 3,
      },
      {
        id: "2",
        user: "u2",
        timestamp: "2024-01-02T10:00:00Z",
        type: "safeReset",
        count: 200,
        keycardCount: 4,
      },
    ];
    render(<SafeManagement />, { wrapper });
    expect(screen.getByText("€100.00")).toHaveTextContent(/^€100\.00$/);
    expect(screen.getByText("€200.00")).toHaveTextContent(/^€200\.00$/);
  });

  it("renders denomination details when available", async () => {
    safeCounts = [
      {
        id: "1",
        user: "u1",
        timestamp: "2024-01-04T10:00:00Z",
        type: "deposit",
        amount: 100,
        denomBreakdown: { "50": 1, "20": 2 },
      },
    ];
    render(<SafeManagement />, { wrapper });
    const toggle = screen.getByRole("button", { name: /view details/i });
    expect(toggle).toBeInTheDocument();
    expect(screen.queryByText("€50.00 x 1")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.getByText("€50.00 x 1")).toBeInTheDocument();
    expect(screen.getByText("€20.00 x 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /hide details/i }));
    expect(screen.queryByText("€50.00 x 1")).not.toBeInTheDocument();
  });

  it("rolls back deposit when cash count fails", async () => {
    safeCounts = [...defaultSafeCounts];
    addCashCount.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /^deposit$/i }));
    const dep = screen.getByText("deposit-form");
    await userEvent.click(dep);

    await waitFor(() =>
      expect(recordDeposit).toHaveBeenCalledWith(10, 1, 1, { a: 1 })
    );
    expect(recordWithdrawal).toHaveBeenCalledWith(10, { a: 1 }, true);
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record deposit.",
      "error"
    );
    expect(updateCount).not.toHaveBeenCalled();
    expect(screen.getByText("deposit-form")).toBeInTheDocument();
  });

  it("rolls back withdrawal when float entry fails", async () => {
    safeCounts = [...defaultSafeCounts];
    recordFloatEntry.mockRejectedValueOnce(new Error("fail"));
    recordWithdrawal.mockResolvedValueOnce(undefined);
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /withdraw/i }));
    const w = screen.getByText("withdraw-form");
    await userEvent.click(w);

    await waitFor(() =>
      expect(recordWithdrawal).toHaveBeenCalledWith(20, { "10": 2 })
    );
    expect(recordDeposit).toHaveBeenCalledWith(20, 0, 0, { "10": 2 });
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record withdrawal.",
      "error"
    );
    expect(screen.getByText("withdraw-form")).toBeInTheDocument();
  });

  it("records safe opening and updates keycards", async () => {
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /^open$/i }));
    const os = screen.getByText("open-form");
    await userEvent.click(os);

    expect(recordOpening).toHaveBeenCalledWith(100, 3);
    expect(updateCount).toHaveBeenCalledWith(3);
    expect(screen.queryByText("open-form")).not.toBeInTheDocument();
  });

  it("shows error when opening safe fails", async () => {
    recordOpening.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /^open$/i }));
    const os = screen.getByText("open-form");
    await userEvent.click(os);

    await waitFor(() => expect(recordOpening).toHaveBeenCalledWith(100, 3));
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record opening.",
      "error"
    );
    expect(screen.getByText("open-form")).toBeInTheDocument();
    expect(updateCount).toHaveBeenNthCalledWith(1, 3);
    await waitFor(() => expect(updateCount).toHaveBeenNthCalledWith(2, 0));
  });

  it("shows error when resetting safe fails", async () => {
    recordReset.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /reset safe/i }));
    const rs = screen.getByText("reset-form");
    await userEvent.click(rs);

    await waitFor(() =>
      expect(recordReset).toHaveBeenCalledWith(300, 5, 5, { "50": 6 })
    );
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record reset.",
      "error"
    );
    expect(screen.getByText("reset-form")).toBeInTheDocument();
    expect(updateCount).toHaveBeenNthCalledWith(1, 5);
    await waitFor(() => expect(updateCount).toHaveBeenNthCalledWith(2, 0));
  });

  it("shows error when reconciliation fails", async () => {
    recordReconcile.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /reconcile/i }));
    const rec = screen.getByText("reconcile-form");
    await userEvent.click(rec);

    await waitFor(() =>
      expect(recordReconcile).toHaveBeenCalledWith(200, 0, 4, 0, { "50": 4 })
    );
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record reconciliation.",
      "error"
    );
    expect(screen.getByText("reconcile-form")).toBeInTheDocument();
    expect(updateCount).toHaveBeenNthCalledWith(1, 4);
    await waitFor(() => expect(updateCount).toHaveBeenNthCalledWith(2, 0));
  });

  it("shows error when bank deposit fails", async () => {
    recordBankDeposit.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(
      screen.getByRole("button", { name: /bank deposit/i })
    );
    const bd = screen.getByText("bank-deposit-form");
    await userEvent.click(bd);

    await waitFor(() =>
      expect(recordBankDeposit).toHaveBeenCalledWith(40, 2, 1)
    );
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record bank deposit.",
      "error"
    );
    expect(updateCount).not.toHaveBeenCalled();
    expect(screen.getByText("bank-deposit-form")).toBeInTheDocument();
  });

  it("reverts keycard count when transfer fails", async () => {
    recordKeycardTransfer.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(
      screen.getByRole("button", { name: /return keycards/i })
    );
    const ret = screen.getByText("return-form");
    await userEvent.click(ret);

    await waitFor(() =>
      expect(returnKeycardsToSafe).toHaveBeenNthCalledWith(1, 2)
    );
    expect(updateCount).toHaveBeenNthCalledWith(1, 2);
    await waitFor(() => expect(updateCount).toHaveBeenNthCalledWith(2, 0));
    await waitFor(() =>
      expect(returnKeycardsToSafe).toHaveBeenNthCalledWith(2, -2)
    );
    expect(recordKeycardTransfer).toHaveBeenCalledWith(2, "toSafe");
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record keycard transfer.",
      "error"
    );
    expect(screen.getByText("return-form")).toBeInTheDocument();
  });

  it("shows toast when safe logic errors without blocking interface", async () => {
    safeCounts = [...defaultSafeCounts];
    safeError = new Error("boom");
    render(<SafeManagement />, { wrapper });

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("boom", "error")
    );
    expect(screen.getByText(/Safe Balance:/)).toHaveTextContent("€50.00");
    expect(screen.getByText("safeReset")).toBeInTheDocument();
  });

  it("shows error when petty cash withdrawal fails", async () => {
    recordPettyWithdrawal.mockRejectedValueOnce(new Error("fail"));
    render(<SafeManagement />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /petty cash/i }));
    const pc = screen.getByText("petty-form");
    await userEvent.click(pc);

    await waitFor(() => expect(recordPettyWithdrawal).toHaveBeenCalledWith(15));
    expect(showToastMock).toHaveBeenCalledWith(
      "Failed to record petty cash withdrawal.",
      "error"
    );
    expect(screen.getByText("petty-form")).toBeInTheDocument();
  });
});
