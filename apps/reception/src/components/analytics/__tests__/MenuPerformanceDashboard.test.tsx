import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import MenuPerformanceDashboard from "../MenuPerformanceDashboard";

jest.mock("../../../hooks/data/bar/useProducts", () => ({
  __esModule: true,
  default: () => ({
    getCategoryTypeByProductName: (_name: string) => "Coffee",
    getProductCategory2: (name: string) => (name === "Soy Milk" ? "milkAddOn" : "coffee"),
  }),
}));

jest.mock("../../../hooks/data/useAllFinancialTransactionsData", () => ({
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

jest.mock("react-chartjs-2", () => ({
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

jest.mock("chart.js", () => ({
  ArcElement: {},
  BarElement: {},
  CategoryScale: {},
  Chart: { register: jest.fn() },
  Legend: {},
  LinearScale: {},
  LineElement: {},
  PointElement: {},
  Title: {},
  Tooltip: {},
}));

afterEach(() => {
  jest.restoreAllMocks();
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
