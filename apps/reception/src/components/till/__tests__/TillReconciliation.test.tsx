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

/* eslint-disable no-var */
var useCashCountsDataMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../hooks/data/useCashCountsData", () => {
  useCashCountsDataMock = jest.fn();
  return { useCashCountsData: useCashCountsDataMock };
});

jest.mock("../../../utils/dateUtils", () => ({
  startOfDayIso: jest.fn(() => "2026-02-28T00:00:00.000+00:00"),
  endOfDayIso: jest.fn(() => "2026-02-28T23:59:59.999+00:00"),
  sameItalyDate: jest.fn(
    (ts: string | number | Date) =>
      typeof ts === "string" && ts.startsWith("2026-02-28")
  ),
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

beforeEach(() => {
  jest.clearAllMocks();
  // Reset baseProps to clean state before each test
  baseProps.user = { user_name: "Tester" };
  baseProps.shiftOpenTime = null;
  baseProps.isEditMode = false;
  baseProps.isDeleteMode = false;
  baseProps.isDrawerOverLimit = false;

  useCashCountsDataMock.mockReturnValue({
    cashCounts: [],
    loading: false,
    error: null,
  });
});

describe("TillReconciliation", () => {
  it("requires login when user missing", () => {
    baseProps.user = null;
    render(<TillReconciliation />);
    expect(screen.getByText(/Not authorized/)).toBeInTheDocument();
  });

  it("shows edit and delete mode alerts", () => {
    baseProps.isEditMode = true;
    baseProps.isDeleteMode = true;
    render(<TillReconciliation />);
    expect(screen.getByText(/Click a row to edit/)).toBeInTheDocument();
    expect(screen.getByText(/Click a row to void/)).toBeInTheDocument();
  });

  it("renders drawer limit warning and invokes handler", async () => {
    baseProps.isDrawerOverLimit = true;
    render(<TillReconciliation />);
    await userEvent.click(screen.getByText("lift"));
    expect(baseProps.handleLiftClick).toHaveBeenCalled();
  });

  // Float nudge banner tests

  it("TC-01: shiftOpenTime=null, no openingFloat today — nudge banner visible with link to /eod-checklist/", () => {
    baseProps.shiftOpenTime = null;
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: false,
      error: null,
    });

    render(<TillReconciliation />);

    expect(screen.getByTestId("float-nudge-banner")).toBeInTheDocument();
    expect(screen.getByTestId("float-nudge-link")).toBeInTheDocument();
  });

  it("TC-02: shiftOpenTime is a Date (shift open) — nudge not shown", () => {
    baseProps.shiftOpenTime = new Date("2026-02-28T08:00:00Z");
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: false,
      error: null,
    });

    render(<TillReconciliation />);

    expect(screen.queryByTestId("float-nudge-banner")).not.toBeInTheDocument();
  });

  it("TC-03: shiftOpenTime=null, openingFloat entry exists today — nudge not shown", () => {
    baseProps.shiftOpenTime = null;
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [
        {
          id: "cc1",
          type: "openingFloat",
          timestamp: "2026-02-28T06:30:00Z",
          amount: 50,
        },
      ],
      loading: false,
      error: null,
    });

    render(<TillReconciliation />);

    expect(screen.queryByTestId("float-nudge-banner")).not.toBeInTheDocument();
  });

  it("TC-04: nudge link href is /eod-checklist/", () => {
    baseProps.shiftOpenTime = null;
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: false,
      error: null,
    });

    render(<TillReconciliation />);

    const link = screen.getByTestId("float-nudge-link");
    expect(link).toHaveAttribute("href", "/eod-checklist/");
  });
});
