import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { Column } from "../SafeTable";
import { SafeTable } from "../SafeTable";

describe("SafeTable", () => {
  interface Row {
    id: string;
    time: string;
    amount: number;
  }

  it("renders headers and rows", () => {
    const columns: Column<Row>[] = [
      { header: "Time", render: (r) => r.time },
      { header: "Amount", render: (r) => `€${r.amount}` },
    ];
    const rows: Row[] = [{ id: "1", time: "10:00", amount: 5 }];

    render(<SafeTable columns={columns} rows={rows} />);

    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("€5")).toBeInTheDocument();
  });

  it("renders without key warnings when rows lack id", () => {
    interface RowNoId {
      timestamp: string;
      value: number;
    }
    const columns: Column<RowNoId>[] = [
      { header: "Time", render: (r) => r.timestamp },
      { header: "Value", render: (r) => r.value },
    ];
    const rows: RowNoId[] = [{ timestamp: "1", value: 10 }];
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<SafeTable columns={columns} rows={rows} />);

    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining("Each child in a list should have a unique \"key\"")
    );
    spy.mockRestore();
  });

  it("keeps rows stable on rerender", () => {
    interface RowNoId {
      timestamp: string;
      value: number;
    }
    const columns: Column<RowNoId>[] = [
      { header: "Time", render: (r) => r.timestamp },
      { header: "Value", render: (r) => r.value },
    ];
    const initialRows: RowNoId[] = [{ timestamp: "1", value: 1 }];
    const { container, rerender } = render(
      <SafeTable
        columns={columns}
        rows={initialRows}
        getRowKey={(r) => r.timestamp}
      />
    );
    const firstRow = container.querySelector("tbody tr");

    const updatedRows: RowNoId[] = [
      { timestamp: "1", value: 2 },
      { timestamp: "2", value: 3 },
    ];
    rerender(
      <SafeTable
        columns={columns}
        rows={updatedRows}
        getRowKey={(r) => r.timestamp}
      />
    );
    const firstRowAfter = container.querySelector("tbody tr");

    expect(firstRowAfter).toBe(firstRow);
    expect(firstRowAfter).toHaveTextContent("2");
  });
});
