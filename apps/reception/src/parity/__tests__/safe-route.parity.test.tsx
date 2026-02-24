import "@testing-library/jest-dom";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SafeManagement from "../../components/safe/SafeManagement";

const updateCountMock = jest.fn();
const returnKeycardsToSafeMock = jest.fn(() => true);
const recordKeycardTransferMock = jest.fn();
const addCashCountMock = jest.fn();
const recordFloatEntryMock = jest.fn();

const recordDepositMock = jest.fn();
const recordWithdrawalMock = jest.fn();
const recordExchangeMock = jest.fn();
const recordOpeningMock = jest.fn();
const recordReconcileMock = jest.fn();
const recordResetMock = jest.fn();
const recordBankDepositMock = jest.fn();
const recordBankWithdrawalMock = jest.fn();
const recordPettyWithdrawalMock = jest.fn();

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      user_name: "Manager",
      email: "manager@example.com",
      roles: ["manager"],
    },
  }),
}));

jest.mock("../../context/SafeDataContext", () => ({
  useSafeData: () => ({
    safeCounts: [
      {
        id: "safe-1",
        user: "Manager",
        timestamp: "2025-01-03T10:00:00.000Z",
        type: "deposit",
        amount: 100,
        keycardCount: 4,
        keycardDifference: 1,
        denomBreakdown: { "50": 2 },
      },
    ],
    safeBalance: 100,
    recordDeposit: (...args: unknown[]) => recordDepositMock(...args),
    recordWithdrawal: (...args: unknown[]) => recordWithdrawalMock(...args),
    recordExchange: (...args: unknown[]) => recordExchangeMock(...args),
    recordOpening: (...args: unknown[]) => recordOpeningMock(...args),
    recordReset: (...args: unknown[]) => recordResetMock(...args),
    recordReconcile: (...args: unknown[]) => recordReconcileMock(...args),
    recordBankDeposit: (...args: unknown[]) => recordBankDepositMock(...args),
    recordBankWithdrawal: (...args: unknown[]) => recordBankWithdrawalMock(...args),
    recordPettyWithdrawal: (...args: unknown[]) =>
      recordPettyWithdrawalMock(...args),
    error: null,
  }),
}));

jest.mock("../../hooks/data/useSafeKeycardCount", () => ({
  useSafeKeycardCount: () => ({ count: 4, updateCount: updateCountMock }),
}));

jest.mock("../../hooks/client/till/useTillShiftActions", () => ({
  useTillShiftActions: () => ({
    returnKeycardsToSafe: (...args: unknown[]) =>
      returnKeycardsToSafeMock(...args),
  }),
}));

jest.mock("../../hooks/useKeycardTransfer", () => ({
  useKeycardTransfer: () => (...args: unknown[]) =>
    recordKeycardTransferMock(...args),
}));

jest.mock("../../hooks/useCashCounts", () => ({
  useCashCounts: () => ({
    addCashCount: (...args: unknown[]) => addCashCountMock(...args),
    recordFloatEntry: (...args: unknown[]) => recordFloatEntryMock(...args),
  }),
}));

jest.mock("../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

jest.mock("../../utils/transaction", () => ({
  runTransaction: async (
    steps: Array<{ run: () => void | Promise<void> }>,
  ): Promise<void> => {
    for (const step of steps) {
      await step.run();
    }
  },
}));

function modalFactory(testId: string) {
  const ModalMock = ({ onCancel }: { onCancel: () => void }) => (
    <div
      role="dialog"
      aria-label={testId}
      data-cy={testId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onCancel();
        }
      }}
    >
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );

  ModalMock.displayName = `${testId}-modal-mock`;
  return ModalMock;
}

jest.mock("../../components/safe/SafeOpenForm", () => {
  const Mock = modalFactory("safe-open-form");
  return { __esModule: true, SafeOpenForm: Mock, default: Mock };
});

jest.mock("../../components/safe/SafeDepositForm", () => {
  const Mock = modalFactory("safe-deposit-form");
  return { __esModule: true, SafeDepositForm: Mock, default: Mock };
});

jest.mock("../../components/safe/SafeWithdrawalForm", () => {
  const Mock = modalFactory("safe-withdrawal-form");
  return { __esModule: true, SafeWithdrawalForm: Mock, default: Mock };
});

jest.mock("../../components/till/ExchangeNotesForm", () => {
  const Mock = modalFactory("safe-exchange-form");
  return { __esModule: true, ExchangeNotesForm: Mock, default: Mock };
});

jest.mock("../../components/safe/BankDepositForm", () => {
  const Mock = modalFactory("safe-bank-deposit-form");
  return { __esModule: true, BankDepositForm: Mock, default: Mock };
});

jest.mock("../../components/safe/PettyCashForm", () => {
  const Mock = modalFactory("safe-petty-cash-form");
  return { __esModule: true, PettyCashForm: Mock, default: Mock };
});

jest.mock("../../components/safe/SafeResetForm", () => {
  const Mock = modalFactory("safe-reset-form");
  return { __esModule: true, SafeResetForm: Mock, default: Mock };
});

jest.mock("../../components/till/ReturnKeycardsModal", () => {
  const Mock = modalFactory("safe-return-keycards-form");
  return { __esModule: true, default: Mock };
});

jest.mock("../../components/safe/SafeReconcileForm", () => {
  const Mock = modalFactory("safe-reconcile-form");
  return { __esModule: true, SafeReconcileForm: Mock, default: Mock };
});

describe("/safe-management parity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches baseline safe selectors and DOM snapshot", () => {
    const { container } = render(<SafeManagement />);

    expect(
      screen.getByRole("heading", { name: /safe management/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/safe balance/i)).toBeInTheDocument();
    expect(screen.getByText(/keycards in safe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /safe transactions/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^Open$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Deposit$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Withdraw$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Exchange$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Reconcile$/i }),
    ).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it("opens and closes action forms and preserves transaction detail toggle", async () => {
    const user = userEvent.setup();
    render(<SafeManagement />);

    const depositButton = screen.getByRole("button", { name: /^Deposit$/i });
    depositButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("safe-deposit-form")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByTestId("safe-deposit-form")).not.toBeInTheDocument();

    const detailsButton = screen.getByRole("button", { name: /view details/i });
    await user.click(detailsButton);
    expect(
      screen.getByRole("button", { name: /hide details/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide details/i }));
    expect(
      screen.getByRole("button", { name: /view details/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Reconcile$/i }));
    const reconcileDialog = screen.getByTestId("safe-reconcile-form");
    expect(reconcileDialog).toBeInTheDocument();
    await user.click(
      within(reconcileDialog).getByRole("button", { name: /cancel/i }),
    );
    expect(screen.queryByTestId("safe-reconcile-form")).not.toBeInTheDocument();
  });
});
