import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

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

const addPmsPostingMock = jest.fn().mockResolvedValue(undefined);
const addTerminalBatchMock = jest.fn().mockResolvedValue(undefined);

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

jest.mock("../../../hooks/mutations/usePmsPostingsMutations", () => ({
  usePmsPostingsMutations: () => ({ addPmsPosting: addPmsPostingMock }),
}));

jest.mock("../../../hooks/mutations/useTerminalBatchesMutations", () => ({
  useTerminalBatchesMutations: () => ({ addTerminalBatch: addTerminalBatchMock }),
}));

describe("ReconciliationWorkbench", () => {
  beforeEach(() => {
    toastMock.mockReset();
    addPmsPostingMock.mockReset().mockResolvedValue(undefined);
    addTerminalBatchMock.mockReset().mockResolvedValue(undefined);
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

  // TC-03: missing-data warning when no entries exist
  it("shows missing-data warnings when no PMS postings or terminal batches", () => {
    pmsPostings = { postings: [], loading: false, error: null };
    terminalBatches = { batches: [], loading: false, error: null };

    render(<ReconciliationWorkbench />);

    expect(
      screen.getByText(/no pms postings entered for today/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no terminal batch entered for today/i)
    ).toBeInTheDocument();
  });

  // TC-03 complement: no warnings when data exists
  it("does not show missing-data warnings when entries exist", () => {
    render(<ReconciliationWorkbench />);

    expect(
      screen.queryByText(/no pms postings entered for today/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/no terminal batch entered for today/i)
    ).not.toBeInTheDocument();
  });

  // TC-04: workbench displays correct totals from manual entries
  it("displays correct totals from manual entries in comparison table", () => {
    pmsPostings = {
      postings: [
        { amount: 100, method: "CASH" },
        { amount: 50, method: "CASH" },
        { amount: 300, method: "CC" },
      ],
      loading: false,
      error: null,
    };
    terminalBatches = {
      batches: [{ amount: 195 }],
      loading: false,
      error: null,
    };

    render(<ReconciliationWorkbench />);

    const pmsRow = screen.getByText("PMS Postings").closest("tr") as HTMLElement;
    expect(within(pmsRow).getByText("€150.00")).toBeInTheDocument(); // CASH total
    expect(within(pmsRow).getByText("€300.00")).toBeInTheDocument(); // CC total

    const termRow = screen.getByText("Terminal Batch").closest("tr") as HTMLElement;
    expect(within(termRow).getByText("€195.00")).toBeInTheDocument();
  });

  // TC-01: PMS posting form submission
  it("submits PMS posting form with correct values", async () => {
    render(<ReconciliationWorkbench />);

    const amountInputs = screen.getAllByPlaceholderText("0.00");
    const pmsAmountInput = amountInputs[0];
    fireEvent.change(pmsAmountInput, { target: { value: "42.50" } });

    const methodSelect = screen.getByDisplayValue("Cash");
    fireEvent.change(methodSelect, { target: { value: "CC" } });

    const noteInputs = screen.getAllByPlaceholderText("Optional");
    fireEvent.change(noteInputs[0], { target: { value: "Room 101" } });

    fireEvent.click(screen.getByRole("button", { name: "Add PMS Posting" }));

    await waitFor(() =>
      expect(addPmsPostingMock).toHaveBeenCalledWith(42.5, "CC", "Room 101")
    );
  });

  // TC-02: Terminal batch form submission
  it("submits terminal batch form with correct values", async () => {
    render(<ReconciliationWorkbench />);

    const amountInputs = screen.getAllByPlaceholderText("0.00");
    const batchAmountInput = amountInputs[1];
    fireEvent.change(batchAmountInput, { target: { value: "500" } });

    fireEvent.click(screen.getByRole("button", { name: "Add Terminal Batch" }));

    await waitFor(() =>
      expect(addTerminalBatchMock).toHaveBeenCalledWith(500, undefined)
    );
  });

  // TC-05: Invalid form submission (missing/invalid amount)
  it("shows error toast when PMS posting form submitted with invalid amount", async () => {
    render(<ReconciliationWorkbench />);

    // Submit without entering amount
    fireEvent.click(screen.getByRole("button", { name: "Add PMS Posting" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "Amount must be greater than zero",
        "error"
      )
    );
    expect(addPmsPostingMock).not.toHaveBeenCalled();
  });

  it("shows error toast when terminal batch form submitted with zero amount", async () => {
    render(<ReconciliationWorkbench />);

    const amountInputs = screen.getAllByPlaceholderText("0.00");
    fireEvent.change(amountInputs[1], { target: { value: "0" } });

    fireEvent.click(screen.getByRole("button", { name: "Add Terminal Batch" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "Amount must be greater than zero",
        "error"
      )
    );
    expect(addTerminalBatchMock).not.toHaveBeenCalled();
  });
});
