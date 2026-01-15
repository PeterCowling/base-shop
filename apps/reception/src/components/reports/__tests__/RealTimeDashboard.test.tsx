import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../hooks/data/useAllFinancialTransactionsData", () => ({
  __esModule: true,
  default: () => ({
    allFinancialTransactions: {
      t1: {
        amount: 10,
        bookingRef: "1",
        count: 1,
        description: "Test",
        itemCategory: "Food",
        method: "cash",
        occupantId: "1",
        timestamp: "2024-01-01T00:00:00Z",
        type: "sale",
        user_name: "user",
      },
    },
    loading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/data/useCashCountsData", () => ({
  __esModule: true,
  useCashCountsData: () => ({
    cashCounts: [
      {
        user: "u",
        timestamp: "2024-01-01T00:00:00Z",
        type: "close",
        difference: 0,
      },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("react-chartjs-2", () => ({
  Bar: () => <div>Bar Chart</div>,
  Pie: () => <div>Pie Chart</div>,
  Line: () => <div>Line Chart</div>,
}));

vi.mock("chart.js", () => ({
  Chart: { register: vi.fn() },
  registerables: [],
}));

import RealTimeDashboard from "../RealTimeDashboard";

describe("RealTimeDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("sets and clears refresh interval", () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(<RealTimeDashboard />);

    expect(screen.getByText("REAL TIME DASHBOARD")).toBeInTheDocument();
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy.mock.calls[0][1]).toBe(60000);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
