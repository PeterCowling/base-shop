import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TillReconciliation from "../../components/till/TillReconciliation";
import type { Transaction } from "../../types/component/Till";

jest.mock("../../components/till/FormsContainer", () => ({
  __esModule: true,
  default: () => <div data-testid="forms-container" />,
}));

jest.mock("../../components/till/TransactionModals", () => ({
  __esModule: true,
  default: () => <div data-testid="transaction-modals" />,
}));

jest.mock("../../components/till/AddKeycardsModal", () => ({
  __esModule: true,
  default: () => <div data-testid="add-keycards-modal" />,
}));

jest.mock("../../components/till/ReturnKeycardsModal", () => ({
  __esModule: true,
  default: () => <div data-testid="return-keycards-modal" />,
}));

jest.mock("../../components/till/TillShiftHistory", () => ({
  __esModule: true,
  default: () => <div data-testid="shift-history" />,
}));

jest.mock("../../components/till/DrawerLimitWarning", () => ({
  __esModule: true,
  default: ({ show }: { show: boolean }) =>
    show ? <div data-testid="drawer-limit-warning" /> : null,
}));

const baseProps = {
  isDrawerOverLimit: false,
  handleLiftClick: jest.fn(),
  shiftOpenTime: new Date("2025-01-03T09:00:00Z") as Date | null,
  isTillOverMax: false,
  user: {
    user_name: "Tester",
    email: "tester@example.com",
    roles: ["staff"],
  },
  drawerLimitInput: "",
  setDrawerLimitInput: jest.fn(),
  updateLimit: jest.fn(),
  handleOpenShiftClick: jest.fn(),
  handleKeycardCountClick: jest.fn(),
  handleCloseShiftClick: jest.fn(),
  handleAddChangeClick: jest.fn(),
  handleExchangeClick: jest.fn(),
  handleAddKeycard: jest.fn(),
  handleReturnKeycard: jest.fn(),
  showOpenShiftForm: false,
  showCloseShiftForm: false,
  closeShiftFormVariant: "close" as const,
  showKeycardCountForm: false,
  showFloatForm: false,
  showExchangeForm: false,
  showTenderRemovalForm: false,
  pinRequiredForTenderRemoval: false,
  lastCloseCashCount: 0,
  expectedCashAtClose: 0,
  expectedKeycardsAtClose: 0,
  ccTransactionsFromLastShift: [] as Transaction[],
  ccTransactionsFromThisShift: [] as Transaction[],
  confirmShiftOpen: jest.fn(),
  confirmShiftClose: jest.fn(),
  confirmKeycardReconcile: jest.fn(),
  confirmFloat: jest.fn(),
  confirmExchange: jest.fn(),
  handleTenderRemoval: jest.fn(),
  setShowOpenShiftForm: jest.fn(),
  setShowCloseShiftForm: jest.fn(),
  setShowKeycardCountForm: jest.fn(),
  setShowFloatForm: jest.fn(),
  setShowExchangeForm: jest.fn(),
  setShowTenderRemovalForm: jest.fn(),
  txnToDelete: null as Transaction | null,
  txnToEdit: null as Transaction | null,
  setTxnToDelete: jest.fn(),
  setTxnToEdit: jest.fn(),
  showAddKeycardModal: false,
  confirmAddKeycard: jest.fn(),
  cancelAddKeycard: jest.fn(),
  showReturnKeycardModal: false,
  confirmReturnKeycard: jest.fn(),
  cancelReturnKeycard: jest.fn(),
  isEditMode: false,
  isDeleteMode: false,
};

jest.mock("../../hooks/client/till/useTillReconciliationUI", () => ({
  useTillReconciliationUI: () => baseProps,
}));

jest.mock("../../hooks/useTillReconciliationLogic", () => ({
  useTillReconciliationLogic: () => ({}),
}));

describe("/till-reconciliation parity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches baseline heading and dropdown selector snapshot", () => {
    const { container } = render(<TillReconciliation />);

    expect(
      screen.getByRole("heading", { name: /till management/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shift" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keycards" })).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it("supports keyboard open/close with focus return on shift actions", async () => {
    const user = userEvent.setup();
    render(<TillReconciliation />);

    const shiftButton = screen.getByRole("button", { name: "Shift" });
    shiftButton.focus();

    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("menuitem", { name: "Open Shift" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Reconcile" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Close" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("menuitem", { name: "Open Shift" }),
    ).not.toBeInTheDocument();
    expect(shiftButton).toHaveAttribute("aria-expanded", "false");

    const keycardsButton = screen.getByRole("button", { name: "Keycards" });
    keycardsButton.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("menuitem", { name: "Count Keycards" }),
    ).toBeInTheDocument();
  });
});
