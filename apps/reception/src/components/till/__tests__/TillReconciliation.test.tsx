import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Transaction } from "../../../types/component/Till";

vi.mock("../ActionButtons", () => ({ __esModule: true, default: () => <div /> }));
vi.mock("../FormsContainer", () => ({ __esModule: true, default: () => <div data-testid="forms" /> }));
vi.mock("../TransactionModals", () => ({ __esModule: true, default: () => <div /> }));
vi.mock("../AddKeycardsModal", () => ({ __esModule: true, default: () => <div /> }));
vi.mock("../ReturnKeycardsModal", () => ({ __esModule: true, default: () => <div /> }));
vi.mock("../DrawerLimitWarning", () => ({
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
  handleLiftClick: vi.fn(),
  shiftOpenTime: null as Date | null,
  isTillOverMax: false,
  user: { user_name: "Tester" } as { user_name: string } | null,
  drawerLimitInput: "",
  setDrawerLimitInput: vi.fn(),
  updateLimit: vi.fn(),
  handleOpenShiftClick: vi.fn(),
  handleKeycardCountClick: vi.fn(),
  handleCloseShiftClick: vi.fn(),
  handleAddChangeClick: vi.fn(),
  handleExchangeClick: vi.fn(),
  handleAddKeycard: vi.fn(),
  handleReturnKeycard: vi.fn(),
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
  confirmShiftOpen: vi.fn(),
  confirmShiftClose: vi.fn(),
  confirmKeycardReconcile: vi.fn(),
  confirmFloat: vi.fn(),
  confirmExchange: vi.fn(),
  handleTenderRemoval: vi.fn(),
  setShowOpenShiftForm: vi.fn(),
  setShowCloseShiftForm: vi.fn(),
  setShowKeycardCountForm: vi.fn(),
  setShowFloatForm: vi.fn(),
  setShowExchangeForm: vi.fn(),
  setShowTenderRemovalForm: vi.fn(),
  txnToDelete: null as Transaction | null,
  txnToEdit: null as Transaction | null,
  setTxnToDelete: vi.fn(),
  setTxnToEdit: vi.fn(),
  showAddKeycardModal: false,
  confirmAddKeycard: vi.fn(),
  cancelAddKeycard: vi.fn(),
  showReturnKeycardModal: false,
  confirmReturnKeycard: vi.fn(),
  cancelReturnKeycard: vi.fn(),
  isEditMode: false,
  isDeleteMode: false,
};

vi.mock("../../../hooks/client/till/useTillReconciliationUI", () => ({
  useTillReconciliationUI: () => baseProps,
}));
vi.mock("../../../hooks/useTillReconciliationLogic", () => ({
  useTillReconciliationLogic: () => ({})
}));

import TillReconciliation from "../TillReconciliation";

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
