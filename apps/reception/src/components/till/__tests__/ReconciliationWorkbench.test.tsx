import "@testing-library/jest-dom";

import { render, screen, waitFor, within } from "@testing-library/react";

import ReconciliationWorkbench from "../ReconciliationWorkbench";

const toastMock = jest.fn();
jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

let tillData = {
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
};

let pmsPostings = {
  postings: [
    { amount: 65, method: "CASH" },
    { amount: 215, method: "CC" },
  ],
  loading: false,
  error: null,
};

let terminalBatches = {
  batches: [{ amount: 200 }],
  loading: false,
  error: null,
};

jest.mock("../../../context/TillDataContext", () => ({
  __esModule: true,
  TillDataProvider: ({
    children,
  }: {
    children: React.ReactNode;
    reportDate?: Date;
  }) => <>{children}</>,
  useTillData: () => tillData,
}));

jest.mock("../../../hooks/data/till/usePmsPostings", () => ({
  __esModule: true,
  default: () => pmsPostings,
}));

jest.mock("../../../hooks/data/till/useTerminalBatches", () => ({
  __esModule: true,
  default: () => terminalBatches,
}));

describe("ReconciliationWorkbench", () => {
  beforeEach(() => {
    toastMock.mockReset();
    tillData = {
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
    };
    pmsPostings = {
      postings: [
        { amount: 65, method: "CASH" },
        { amount: 215, method: "CC" },
      ],
      loading: false,
      error: null,
    };
    terminalBatches = {
      batches: [{ amount: 200 }],
      loading: false,
      error: null,
    };
  });

  it("renders totals and difference styling", async () => {
    render(<ReconciliationWorkbench />);

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
    document.documentElement.classList.add("dark");
    const { container } = render(<ReconciliationWorkbench />);
    const thead = container.querySelector("thead") as HTMLElement;
    expect(thead).toHaveClass("dark:bg-darkSurface");
    const posRow = screen.getByText("POS Totals").closest("tr") as HTMLElement;
    expect(posRow).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("handles invalid totals gracefully", async () => {
    tillData = {
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
    };
    pmsPostings = {
      postings: [],
      loading: false,
      error: null,
    };
    terminalBatches = {
      batches: [],
      loading: false,
      error: null,
    };
    render(<ReconciliationWorkbench />);

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
