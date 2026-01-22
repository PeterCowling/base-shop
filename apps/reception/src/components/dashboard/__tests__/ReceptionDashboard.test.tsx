import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import ReceptionDashboard from "../ReceptionDashboard";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { displayName: "Pete", email: "pete@example.com" } }),
}));

jest.mock("../../../hooks/data/useAllFinancialTransactionsData", () => ({
  __esModule: true,
  default: () => ({
    allFinancialTransactions: {},
    loading: false,
    error: null,
  }),
}));

jest.mock("../../../hooks/data/useCheckins", () => ({
  useCheckins: () => ({
    checkins: { "2025-01-01": { occ1: { reservationCode: "1" } } },
    loading: false,
    error: null,
  }),
}));

jest.mock("../../../hooks/data/useCheckouts", () => ({
  useCheckouts: () => ({
    checkouts: {
      "2025-01-01": { occ2: { reservationCode: "2" } },
      "2025-01-02": { occ3: { reservationCode: "3" } },
    },
    loading: false,
    error: null,
  }),
}));

jest.mock("../../../utils/dateUtils", () => ({
  addDays: (date: Date) => date,
  formatItalyDate: () => "01/01/2025",
  getLocalToday: () => "2025-01-01",
  getLocalYyyyMmDd: () => "2025-01-02",
}));

jest.mock("../DashboardQuickActions", () => ({
  DashboardQuickActions: () => <div>Quick Actions</div>,
}));

describe("ReceptionDashboard", () => {
  it("renders the dashboard overview", () => {
    render(<ReceptionDashboard />);

    expect(screen.getByText("Reception Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("Pete")).toBeInTheDocument();
    expect(screen.getByText("Arrivals Today")).toBeInTheDocument();
    expect(screen.getByText("Departures Today")).toBeInTheDocument();
    expect(screen.getByText("Departures Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });
});