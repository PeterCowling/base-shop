import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

async function loadComponent(transactions: Array<{ id: string; text: string }>) {
  vi.resetModules();

  vi.doMock("../../../context/TillDataContext", () => ({
    __esModule: true,
    TillDataProvider: ({
      children,
    }: {
      children: React.ReactNode;
      reportDate?: Date;
    }) => <>{children}</>,
  }));

  vi.doMock("../../../hooks/client/till/useTillReconciliationUI", () => ({
    __esModule: true,
    useTillReconciliationUI: () => ({
      user: { user_name: "Pete" },
      isDeleteMode: false,
      isEditMode: false,
      handleRowClickForDelete: vi.fn(),
      handleRowClickForEdit: vi.fn(),
    }),
  }));

  vi.doMock("../../../hooks/useTillReconciliationLogic", () => ({
    __esModule: true,
    useTillReconciliationLogic: () => ({
      shiftOpenTime: 1,
      shiftOwner: "Pete",
      openingCash: 0,
      openingKeycards: 0,
      finalCashCount: 0,
      finalKeycardCount: 0,
      netCash: 0,
      creditSlipTotal: 0,
      netCC: 0,
      docDepositsCount: 0,
      docReturnsCount: 0,
      keycardsLoaned: 0,
      keycardsReturned: 0,
      expectedKeycardsAtClose: 0,
      expectedCashAtClose: 0,
      filteredTransactions: transactions,
    }),
  }));

  vi.doMock("../../till/SummaryAndTransactions", () => ({
    __esModule: true,
    default: ({
      filteredTransactions,
    }: {
      filteredTransactions: Array<{ id: string; text: string }>;
    }) => (
      <ul>
        {filteredTransactions.length ? (
          filteredTransactions.map((item) => <li key={item.id}>{item.text}</li>)
        ) : (
          <p>No items</p>
        )}
      </ul>
    ),
  }));

  const mod = await import("../Live");
  return mod.default;
}

describe("Live", () => {
  it("renders list items", async () => {
    const Comp = await loadComponent([
      { id: "1", text: "First" },
      { id: "2", text: "Second" },
    ]);

    render(<Comp />);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("handles empty state", async () => {
    const Comp = await loadComponent([]);

    render(<Comp />);

    expect(screen.getByText("No items")).toBeInTheDocument();
  });
});

