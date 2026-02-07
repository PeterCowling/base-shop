import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TillReconciliation from "../TillReconciliation";

jest.mock("../../../hoc/withModalBackground", () => ({
  withModalBackground: (Comp: React.ComponentType) => Comp,
}));

const drawerState = {
  overLimit: false,
  overMax: false,
};

const useTillLogicMock = jest.fn(() => ({
  // use a user with cash permissions so all dropdowns render
  user: { user_name: "Pete", email: "t@test", roles: ["staff"] },
  shiftOpenTime: new Date(),
  shiftOwner: "test",
  openingCash: 0,
  finalCashCount: 0,
  netCash: 0,
  creditSlipTotal: 0,
  netCC: 0,
  docDepositsCount: 0,
  docReturnsCount: 0,
  keycardsLoaned: 0,
  keycardsReturned: 0,
  expectedCashAtClose: 0,
  filteredTransactions: [],
  ccTransactionsFromLastShift: [],
  ccTransactionsFromThisShift: [],
  showOpenShiftForm: false,
  showCloseShiftForm: false,
  isTillOverMax: drawerState.overMax,
  isDrawerOverLimit: drawerState.overLimit,
  pinRequiredForTenderRemoval: false,
  setShowOpenShiftForm: jest.fn(),
  setShowCloseShiftForm: jest.fn(),
  handleOpenShiftClick: jest.fn(),
  confirmShiftOpen: jest.fn(),
  handleCloseShiftClick: jest.fn(),
  confirmShiftClose: jest.fn(),
  lastCloseCashCount: 0,
}));

jest.mock("../../../hooks/client/till/useTillShifts", () => ({
  useTillShifts: () => useTillLogicMock(),
}));
jest.mock("../../../hooks/useCashCounts", () => ({
  useCashCounts: () => ({ recordFloatEntry: jest.fn(), addCashCount: jest.fn() }),
}));
jest.mock("../../../hooks/useSafeLogic", () => ({
  useSafeLogic: () => ({
    recordDeposit: jest.fn(),
    recordWithdrawal: jest.fn(),
    recordBankWithdrawal: jest.fn(),
    recordExchange: jest.fn(),
  }),
}));
jest.mock("../../../hooks/data/useCashDrawerLimit", () => ({
  useCashDrawerLimit: () => ({ limit: null, updateLimit: jest.fn() }),
}));
jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));
jest.mock("../../../hooks/data/useSafeKeycardCount", () => ({
  useSafeKeycardCount: () => ({ count: 0, updateCount: jest.fn() }),
}));
jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { user_name: "Pete", email: "t@test", roles: ["staff"] },
    setUser: jest.fn(),
  }),
}));

describe("TillReconciliation drawer limit warning", () => {
  beforeEach(() => {
    drawerState.overLimit = false;
    drawerState.overMax = false;
    useTillLogicMock.mockClear();
  });

  it("shows warning when over limit", async () => {
    drawerState.overLimit = true;
    render(<TillReconciliation />);
    expect(screen.getByText(/Cash exceeds drawer limit/i)).toBeInTheDocument();
  });

  it("hides warning when within limit", async () => {
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
    const liftButton = screen.getByRole("button", { name: /lift/i });
    expect(liftButton.className).not.toMatch(/animate-pulse/);
  });
});
