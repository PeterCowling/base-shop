import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

async function loadComp(overLimit: boolean, overMax = false) {
  vi.resetModules();

  const useTillLogicMock = vi.fn().mockReturnValue({
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
    setShowOpenShiftForm: vi.fn(),
    setShowCloseShiftForm: vi.fn(),
    handleOpenShiftClick: vi.fn(),
    confirmShiftOpen: vi.fn(),
    handleCloseShiftClick: vi.fn(),
    confirmShiftClose: vi.fn(),
    lastCloseCashCount: 0,
  });

  vi.doMock("../../../hooks/client/till/useTillShifts", () => ({
    useTillShifts: useTillLogicMock,
  }));
  vi.doMock("../../../hooks/useCashCounts", () => ({
    useCashCounts: () => ({ recordFloatEntry: vi.fn(), addCashCount: vi.fn() }),
  }));
  vi.doMock("../../../hooks/useSafeLogic", () => ({
    useSafeLogic: () => ({
      recordDeposit: vi.fn(),
      recordWithdrawal: vi.fn(),
      recordBankWithdrawal: vi.fn(),
      recordExchange: vi.fn(),
    }),
  }));
  vi.doMock("../../../hooks/data/useCashDrawerLimit", () => ({
    useCashDrawerLimit: () => ({ limit: null, updateLimit: vi.fn() }),
  }));
  vi.doMock("../../../services/useFirebase", () => ({
    useFirebaseDatabase: () => ({}),
  }));
  vi.doMock("../../../hooks/data/useSafeKeycardCount", () => ({
    useSafeKeycardCount: () => ({ count: 0, updateCount: vi.fn() }),
  }));
  vi.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({
      user: { user_name: "Pete", email: "t@test" },
      setUser: vi.fn(),
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
