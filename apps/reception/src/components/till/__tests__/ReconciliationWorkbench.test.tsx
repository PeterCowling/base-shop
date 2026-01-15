import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.fn();
vi.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

async function loadComp() {
  vi.resetModules();

  const useTillDataMock = vi.fn().mockReturnValue({
    transactions: [
      { txnId: "t1", amount: 50, method: "CASH" },
      { txnId: "t2", amount: 20, method: "CASH" },
      { txnId: "t3", amount: 200, method: "CC" },
    ],
    cashCounts: [
      {
        user: "tester",
        timestamp: "2024-01-01T10:00:00Z",
        type: "close",
        count: 70,
        difference: 0,
      },
    ],
    creditSlips: [],
    isShiftOpen: true,
    loading: false,
    error: null,
  });

  const usePmsPostingsMock = vi.fn().mockReturnValue({
    postings: [
      { amount: 65, method: "CASH" },
      { amount: 215, method: "CC" },
    ],
    loading: false,
    error: null,
  });

  const useTerminalBatchesMock = vi.fn().mockReturnValue({
    batches: [{ amount: 200 }],
    loading: false,
    error: null,
  });

  vi.doMock("../../../context/TillDataContext", () => ({
    __esModule: true,
    TillDataProvider: ({
      children,
    }: {
      children: React.ReactNode;
      reportDate?: Date;
    }) => <>{children}</>,
    useTillData: useTillDataMock,
  }));

  vi.doMock("../../../hooks/data/till/usePmsPostings", () => ({
    __esModule: true,
    default: usePmsPostingsMock,
  }));

  vi.doMock("../../../hooks/data/till/useTerminalBatches", () => ({
    __esModule: true,
    default: useTerminalBatchesMock,
  }));

  const mod = await import("../ReconciliationWorkbench");
  return mod.default;
}

async function loadCompInvalid() {
  vi.resetModules();

  const useTillDataMock = vi.fn().mockReturnValue({
    transactions: [
      { txnId: "t1", amount: -50, method: "CASH" },
      { txnId: "t2", amount: 20, method: "CASH" },
    ],
    cashCounts: [
      {
        user: "tester",
        timestamp: "2024-01-01T10:00:00Z",
        type: "close",
        count: 70,
        difference: 0,
      },
    ],
    creditSlips: [],
    isShiftOpen: true,
    loading: false,
    error: null,
  });

  const usePmsPostingsMock = vi.fn().mockReturnValue({
    postings: [],
    loading: false,
    error: null,
  });

  const useTerminalBatchesMock = vi.fn().mockReturnValue({
    batches: [],
    loading: false,
    error: null,
  });

  vi.doMock("../../../context/TillDataContext", () => ({
    __esModule: true,
    TillDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTillData: useTillDataMock,
  }));

  vi.doMock("../../../hooks/data/till/usePmsPostings", () => ({
    __esModule: true,
    default: usePmsPostingsMock,
  }));

  vi.doMock("../../../hooks/data/till/useTerminalBatches", () => ({
    __esModule: true,
    default: useTerminalBatchesMock,
  }));

  const mod = await import("../ReconciliationWorkbench");
  return mod.default;
}

describe("ReconciliationWorkbench", () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  it("renders totals and difference styling", async () => {
    const Comp = await loadComp();
    render(<Comp />);

    const posRow = screen.getByText("POS Totals").closest("tr") as HTMLElement;
    expect(within(posRow).getByText("€70.00")).toBeInTheDocument();
    expect(within(posRow).getByText("€200.00")).toBeInTheDocument();

    const drawerRow = screen
      .getByText("Cash Drawer")
      .closest("tr") as HTMLElement;
    expect(within(drawerRow).getByText("€70.00")).toHaveClass(
      "text-success-main"
    );
    expect(within(drawerRow).getByText("€0.00")).toHaveClass(
      "text-success-main"
    );

    const pmsRow = screen
      .getByText("PMS Postings")
      .closest("tr") as HTMLElement;
    expect(within(pmsRow).getByText("€65.00")).toBeInTheDocument();
    expect(within(pmsRow).getByText("€215.00")).toBeInTheDocument();
    expect(within(pmsRow).getByText("€-5.00")).toHaveClass("text-error-main");
    expect(within(pmsRow).getByText("€15.00")).toHaveClass("text-error-main");

    const termRow = screen
      .getByText("Terminal Batch")
      .closest("tr") as HTMLElement;
    expect(within(termRow).getByText("€200.00")).toBeInTheDocument();
    expect(within(termRow).getByText("€0.00")).toHaveClass("text-success-main");
  });

  it("applies dark mode table styles", async () => {
    const Comp = await loadComp();
    document.documentElement.classList.add("dark");
    const { container } = render(<Comp />);
    const thead = container.querySelector("thead") as HTMLElement;
    expect(thead).toHaveClass("dark:bg-darkSurface");
    const posRow = screen.getByText("POS Totals").closest("tr") as HTMLElement;
    expect(posRow).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("handles invalid totals gracefully", async () => {
    const Comp = await loadCompInvalid();
    render(<Comp />);

    const posRow = screen.getByText("POS Totals").closest("tr") as HTMLElement;
    expect(within(posRow).getAllByText("€0.00")[0]).toBeInTheDocument();
    expect(
      screen.getByText(/some values could not be parsed/i)
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "Invalid reconciliation data",
        "error"
      )
    );
  });
});
