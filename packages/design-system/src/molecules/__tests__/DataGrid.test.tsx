/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { createSelectionColumn, DataGrid } from "../DataGrid";

interface TestRow {
  id: string;
  name: string;
  age: number;
}

const TEST_DATA: TestRow[] = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
  { id: "3", name: "Charlie", age: 35 },
  { id: "4", name: "Diana", age: 28 },
  { id: "5", name: "Eve", age: 22 },
];

const TEST_COLUMNS: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "age", header: "Age" },
];

describe("DataGrid", () => {
  it("renders columns and data correctly", async () => {
    const { container } = render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Eve")).toBeInTheDocument();
  });

  it("shows empty message when data is empty", () => {
    render(<DataGrid columns={TEST_COLUMNS} data={[]} emptyMessage="No records found" />);

    expect(screen.getByText("No records found")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows default empty message when no emptyMessage provided", () => {
    render(<DataGrid columns={TEST_COLUMNS} data={[]} />);

    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} loading loadingMessage="Fetching..." />);

    expect(screen.getByText("Fetching...")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = jest.fn();
    render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText("Alice").closest("tr")!);
    expect(onRowClick).toHaveBeenCalledWith(TEST_DATA[0]);

  });

  describe("sorting", () => {
    it("sorts rows when header is clicked", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} sortable />);

      const nameHeader = screen.getByText("Name");
      fireEvent.click(nameHeader);

      const rows = screen.getAllByRole("row");
      // First row is header, data rows follow
      expect(rows[1]).toHaveTextContent("Alice");
      expect(rows[5]).toHaveTextContent("Eve");

      // Click again for descending
      fireEvent.click(nameHeader);
      const rowsDesc = screen.getAllByRole("row");
      expect(rowsDesc[1]).toHaveTextContent("Eve");
    });

    it("shows sort indicators", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} sortable />);

      const nameHeader = screen.getByText("Name");
      fireEvent.click(nameHeader);

      // Should show ascending indicator (svg)
      const headerCell = nameHeader.closest("th")!;
      expect(headerCell.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    it("renders search input when filterable", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} filterable />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("filters rows based on search input", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} filterable />);

      const search = screen.getByRole("searchbox");
      fireEvent.change(search, { target: { value: "Ali" } });

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("does not render search input when not filterable", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} />);

      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    const MANY_ROWS: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `Person ${i}`,
      age: 20 + i,
    }));

    it("shows only pageSize rows at a time", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={MANY_ROWS} paginated pageSize={5} />);

      // Should show 5 data rows + 1 header row = 6 rows total
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(6);
      expect(screen.getByText("Person 0")).toBeInTheDocument();
      expect(screen.queryByText("Person 5")).not.toBeInTheDocument();
    });

    it("shows pagination controls when pageCount > 1", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={MANY_ROWS} paginated pageSize={5} />);

      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("does not show pagination when all data fits on one page", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} paginated pageSize={10} />);

      expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("renders checkboxes when selectable with createSelectionColumn", () => {
      const columns: ColumnDef<TestRow, unknown>[] = [
        createSelectionColumn<TestRow>(),
        ...TEST_COLUMNS,
      ];
      render(<DataGrid columns={columns} data={TEST_DATA} selectable />);

      const checkboxes = screen.getAllByRole("checkbox");
      // 1 header checkbox + 5 row checkboxes
      expect(checkboxes).toHaveLength(6);

    });

    it("toggles row selection", () => {
      const onRowSelectionChange = jest.fn();
      const columns: ColumnDef<TestRow, unknown>[] = [
        createSelectionColumn<TestRow>(),
        ...TEST_COLUMNS,
      ];
      render(
        <DataGrid
          columns={columns}
          data={TEST_DATA}
          selectable
          onRowSelectionChange={onRowSelectionChange}
          getRowId={(row) => row.id}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      // Click first row checkbox
      fireEvent.click(checkboxes[1]);
      expect(onRowSelectionChange).toHaveBeenCalled();
    });

    it("select all toggles all rows", () => {
      const onRowSelectionChange = jest.fn();
      const columns: ColumnDef<TestRow, unknown>[] = [
        createSelectionColumn<TestRow>(),
        ...TEST_COLUMNS,
      ];
      render(
        <DataGrid
          columns={columns}
          data={TEST_DATA}
          selectable
          onRowSelectionChange={onRowSelectionChange}
          getRowId={(row) => row.id}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      // Click header checkbox (select all)
      fireEvent.click(checkboxes[0]);
      expect(onRowSelectionChange).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("applies striped class to alternating rows", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} striped />);

      const rows = screen.getAllByRole("row");
      // rows[0] is header, rows[1] is first data row (even, no stripe), rows[2] is second (odd, striped)
      expect(rows[2].className).toContain("bg-surface-2/50");
      expect(rows[1].className).not.toContain("bg-surface-2/50");
    });

    it("applies dense class for compact mode", () => {
      render(<DataGrid columns={TEST_COLUMNS} data={TEST_DATA} dense />);

      const headerCells = screen.getAllByRole("columnheader");
      expect(headerCells[0].className).toContain("py-1");
    });
  });
});
