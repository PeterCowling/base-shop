import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Transaction } from "../../../types/component/Till";
import TillReconciliation from "../TillReconciliation";

jest.mock("../ActionButtons", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../FormsContainer", () => ({ __esModule: true, default: () => <div data-testid="forms" /> }));
jest.mock("../TransactionModals", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../AddKeycardsModal", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../ReturnKeycardsModal", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../TillShiftHistory", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../DrawerLimitWarning", () => ({
  __esModule: true,
  default: ({
    show,
    onLift,
  }: {
    show: boolean;
    onLift: () => void;
  }) => (show ? <button onClick={onLift}>lift</button> : null),
}));

const baseProps = {
  isDrawerOverLimit: false,
  handleLiftClick: jest.fn(),
  shiftOpenTime: null as Date | null,
  isTillOverMax: false,
  user: { user_name: "Tester" } as { user_name: string } | null,
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

jest.mock("../../../hooks/client/till/useTillReconciliationUI", () => ({
  useTillReconciliationUI: () => baseProps,
}));
jest.mock("../../../hooks/useTillReconciliationLogic", () => ({
  useTillReconciliationLogic: () => ({})
}));

describe("TillReconciliation", () => {
  it("requires login when user missing", () => {
    baseProps.user = null;
    render(<TillReconciliation />);
    expect(screen.getByText(/Not authorized/)).toBeInTheDocument();
  });

  it("shows edit and delete mode alerts", () => {
    baseProps.user = { user_name: "Tester" };
    baseProps.isEditMode = true;
    baseProps.isDeleteMode = true;
    render(<TillReconciliation />);
    expect(screen.getByText(/Click a row to edit/)).toBeInTheDocument();
    expect(screen.getByText(/Click a row to delete/)).toBeInTheDocument();
  });

  it("renders drawer limit warning and invokes handler", async () => {
    baseProps.isDrawerOverLimit = true;
    render(<TillReconciliation />);
    await userEvent.click(screen.getByText("lift"));
    expect(baseProps.handleLiftClick).toHaveBeenCalled();
    baseProps.isDrawerOverLimit = false;
  });
});
