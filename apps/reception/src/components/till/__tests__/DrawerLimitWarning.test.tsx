import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function loadComp(overLimit: boolean, overMax = false) {
  jest.resetModules();

  const useTillLogicMock = jest.fn().mockReturnValue({
    // use a user with cash permissions so all dropdowns render
    user: { user_name: "Pete", email: "t@test" },
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
    isTillOverMax: overMax,
    isDrawerOverLimit: overLimit,
    pinRequiredForTenderRemoval: false,
    setShowOpenShiftForm: jest.fn(),
    setShowCloseShiftForm: jest.fn(),
    handleOpenShiftClick: jest.fn(),
    confirmShiftOpen: jest.fn(),
    handleCloseShiftClick: jest.fn(),
    confirmShiftClose: jest.fn(),
    lastCloseCashCount: 0,
  });

  jest.doMock("../../../hooks/client/till/useTillShifts", () => ({
    useTillShifts: useTillLogicMock,
  }));
  jest.doMock("../../../hooks/useCashCounts", () => ({
    useCashCounts: () => ({ recordFloatEntry: jest.fn(), addCashCount: jest.fn() }),
  }));
  jest.doMock("../../../hooks/useSafeLogic", () => ({
    useSafeLogic: () => ({
      recordDeposit: jest.fn(),
      recordWithdrawal: jest.fn(),
      recordBankWithdrawal: jest.fn(),
      recordExchange: jest.fn(),
    }),
  }));
  jest.doMock("../../../hooks/data/useCashDrawerLimit", () => ({
    useCashDrawerLimit: () => ({ limit: null, updateLimit: jest.fn() }),
  }));
  jest.doMock("../../../services/useFirebase", () => ({
    useFirebaseDatabase: () => ({}),
  }));
  jest.doMock("../../../hooks/data/useSafeKeycardCount", () => ({
    useSafeKeycardCount: () => ({ count: 0, updateCount: jest.fn() }),
  }));
  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({
      user: { user_name: "Pete", email: "t@test" },
      setUser: jest.fn(),
    }),
  }));

  const mod = await import("../TillReconciliation");
  return mod.default;
}

describe("TillReconciliation drawer limit warning", () => {
  it("shows warning when over limit", async () => {
    const Comp = await loadComp(true);
    render(<Comp />);
    expect(screen.getByText(/Cash exceeds drawer limit/i)).toBeInTheDocument();
  });

  it("hides warning when within limit", async () => {
    const Comp = await loadComp(false);
    render(<Comp />);
    expect(
      screen.queryByText(/Cash exceeds drawer limit/i)
    ).not.toBeInTheDocument();
  });

  it("ignores till max when under drawer limit", async () => {
    const Comp = await loadComp(false, true);
    render(<Comp />);
    expect(
      screen.queryByText(/Cash exceeds drawer limit/i)
    ).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cash" }));
    const liftButton = screen.getByRole("button", { name: /lift/i });
    expect(liftButton.className).not.toMatch(/animate-pulse/);
  });
});
