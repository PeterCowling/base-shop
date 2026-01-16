import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../hooks/data/bar/useProducts", () => ({
  __esModule: true,
  default: () => ({
    getCategoryTypeByProductName: (_name: string) => "Coffee",
    getProductCategory2: (name: string) => (name === "Soy Milk" ? "milkAddOn" : "coffee"),
  }),
}));

vi.mock("../../../hooks/data/useAllFinancialTransactionsData", () => ({
  __esModule: true,
  default: () => ({
    allFinancialTransactions: {
      tx1: {
        amount: 10,
        bookingRef: "1",
        count: 1,
        description: "Americano",
        itemCategory: "Coffee",
        method: "cash",
        occupantId: "o1",
        timestamp: "2024-06-01T12:00:00Z",
        type: "sale",
        user_name: "tester",
      },
      tx2: {
        amount: 2,
        bookingRef: "1",
        count: 1,
        description: "Soy Milk",
        itemCategory: "Coffee",
        method: "cash",
        occupantId: "o1",
        timestamp: "2024-06-01T12:05:00Z",
        type: "sale",
        user_name: "tester",
      },
    },
    loading: false,
    error: null,
  }),
}));

vi.mock("react-chartjs-2", () => ({
  Bar: ({ data }: { data: unknown }) => (
    <pre data-testid="bar">{JSON.stringify(data)}</pre>
  ),
  Doughnut: ({ data }: { data: unknown }) => (
    <pre data-testid="doughnut">{JSON.stringify(data)}</pre>
  ),
  Line: ({ data }: { data: unknown }) => (
    <pre data-testid="line">{JSON.stringify(data)}</pre>
  ),
}));

vi.mock("chart.js", () => ({
  ArcElement: {},
  BarElement: {},
  CategoryScale: {},
  Chart: { register: vi.fn() },
  Legend: {},
  LinearScale: {},
  LineElement: {},
  PointElement: {},
  Title: {},
  Tooltip: {},
}));

import MenuPerformanceDashboard from "../MenuPerformanceDashboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MenuPerformanceDashboard", () => {
  it("shows computed margin and attach rate", () => {
    render(<MenuPerformanceDashboard />);

    expect(screen.getByText(/Overall Margin/i)).toHaveTextContent(
      "Overall Margin: 70%"
    );
    expect(screen.getByText(/Attach Rate/i)).toHaveTextContent(
      "Attach Rate: 100.0%"
    );

    const barData = JSON.parse(
      screen.getByTestId("bar").textContent as string
    );
    expect(barData.datasets[0].data).toEqual([70]);

    const doughnutData = JSON.parse(
      screen.getByTestId("doughnut").textContent as string
    );
    expect(doughnutData.datasets[0].data).toEqual([1, 1]);
  });
});
