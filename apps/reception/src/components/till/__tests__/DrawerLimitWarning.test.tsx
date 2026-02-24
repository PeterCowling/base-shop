import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TillReconciliation from "../TillReconciliation";

jest.mock("../FormsContainer", () => {
  function MockFormsContainer() {
    return <div data-testid="forms-container" />;
  }
  return MockFormsContainer;
});
jest.mock("../TransactionModals", () => {
  function MockTransactionModals() {
    return <div data-testid="txn-modals" />;
  }
  return MockTransactionModals;
});
jest.mock("../TillShiftHistory", () => {
  function MockTillShiftHistory() {
    return <div data-testid="till-history" />;
  }
  return MockTillShiftHistory;
});
jest.mock("../AddKeycardsModal", () => {
  function MockAddKeycardsModal() {
    return <div data-testid="add-keycards" />;
  }
  return MockAddKeycardsModal;
});
jest.mock("../ReturnKeycardsModal", () => {
  function MockReturnKeycardsModal() {
    return <div data-testid="return-keycards" />;
  }
  return MockReturnKeycardsModal;
});

const drawerState = {
  overLimit: false,
  overMax: false,
};

const noop = jest.fn();

const useTillReconciliationUIMock = jest.fn(() => ({
  showFloatForm: false,
  setShowFloatForm: noop,
  showExchangeForm: false,
  setShowExchangeForm: noop,
  showTenderRemovalForm: false,
  setShowTenderRemovalForm: noop,
  drawerLimitInput: "",
  setDrawerLimitInput: noop,
  isDeleteMode: false,
  setIsDeleteMode: noop,
  txnToDelete: null,
  setTxnToDelete: noop,
  isEditMode: false,
  setIsEditMode: noop,
  txnToEdit: null,
  setTxnToEdit: noop,
  closeCashForms: noop,
  handleAddChangeClick: noop,
  handleExchangeClick: noop,
  handleLiftClick: noop,
  handleRowClickForDelete: noop,
  handleRowClickForEdit: noop,
}));

const useTillReconciliationLogicMock = jest.fn(() => ({
  user: { user_name: "Pete", email: "t@test", roles: ["staff"] },
  shiftOpenTime: new Date(),
  isTillOverMax: drawerState.overMax,
  isDrawerOverLimit: drawerState.overLimit,
  drawerLimitInput: "",
  setDrawerLimitInput: noop,
  updateLimit: noop,
  handleOpenShiftClick: noop,
  handleKeycardCountClick: noop,
  handleCloseShiftClick: noop,
  handleAddChangeClick: noop,
  handleExchangeClick: noop,
  handleAddKeycard: noop,
  handleReturnKeycard: noop,
  handleLiftClick: noop,
  isEditMode: false,
  isDeleteMode: false,
  showOpenShiftForm: false,
  showCloseShiftForm: false,
  closeShiftFormVariant: "close",
  showKeycardCountForm: false,
  showFloatForm: false,
  showExchangeForm: false,
  showTenderRemovalForm: false,
  pinRequiredForTenderRemoval: false,
  lastCloseCashCount: 0,
  expectedCashAtClose: 0,
  expectedKeycardsAtClose: 0,
  ccTransactionsFromLastShift: [],
  ccTransactionsFromThisShift: [],
  confirmShiftOpen: noop,
  confirmShiftClose: noop,
  confirmKeycardReconcile: noop,
  confirmFloat: noop,
  confirmExchange: noop,
  handleTenderRemoval: noop,
  setShowOpenShiftForm: noop,
  setShowCloseShiftForm: noop,
  setShowKeycardCountForm: noop,
  setShowFloatForm: noop,
  setShowExchangeForm: noop,
  setShowTenderRemovalForm: noop,
  txnToDelete: null,
  txnToEdit: null,
  setTxnToDelete: noop,
  setTxnToEdit: noop,
  showAddKeycardModal: false,
  showReturnKeycardModal: false,
  confirmAddKeycard: noop,
  confirmReturnKeycard: noop,
  cancelAddKeycard: noop,
  cancelReturnKeycard: noop,
}));

jest.mock("../../../hooks/client/till/useTillReconciliationUI", () => ({
  useTillReconciliationUI: () => useTillReconciliationUIMock(),
}));

jest.mock("../../../hooks/useTillReconciliationLogic", () => ({
  useTillReconciliationLogic: (...args: unknown[]) =>
    useTillReconciliationLogicMock(...args),
}));

describe("TillReconciliation drawer limit warning", () => {
  beforeEach(() => {
    drawerState.overLimit = false;
    drawerState.overMax = false;
    useTillReconciliationUIMock.mockClear();
    useTillReconciliationLogicMock.mockClear();
  });

  it("shows warning when over limit", () => {
    drawerState.overLimit = true;
    render(<TillReconciliation />);
    expect(screen.getByText(/Cash exceeds drawer limit/i)).toBeInTheDocument();
  });

  it("hides warning when within limit", () => {
    render(<TillReconciliation />);
    expect(
      screen.queryByText(/Cash exceeds drawer limit/i)
    ).not.toBeInTheDocument();
  });

  it("ignores till max when under drawer limit", async () => {
    drawerState.overMax = true;
    render(<TillReconciliation />);
    expect(
      screen.queryByText(/Cash exceeds drawer limit/i)
    ).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cash" }));
    const liftButton = screen.getByRole("menuitem", { name: /lift/i });
    expect(liftButton).not.toHaveClass("animate-pulse");
  });
});
