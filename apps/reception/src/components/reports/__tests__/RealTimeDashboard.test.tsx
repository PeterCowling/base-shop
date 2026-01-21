import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("../../../hooks/data/useAllFinancialTransactionsData", () => ({
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

jest.mock("../../../hooks/data/useCashCountsData", () => ({
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

jest.mock("react-chartjs-2", () => ({
  Bar: () => <div>Bar Chart</div>,
  Pie: () => <div>Pie Chart</div>,
  Line: () => <div>Line Chart</div>,
}));

jest.mock("chart.js", () => ({
  Chart: { register: jest.fn() },
  registerables: [],
}));

import RealTimeDashboard from "../RealTimeDashboard";

describe("RealTimeDashboard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("sets and clears refresh interval", () => {
    jest.useFakeTimers();
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    const { unmount } = render(<RealTimeDashboard />);

    expect(screen.getByText("REAL TIME DASHBOARD")).toBeInTheDocument();
    expect(setIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy.mock.calls[0][1]).toBe(60000);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
