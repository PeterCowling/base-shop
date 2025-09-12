import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, type Column } from "./DataTable";
import "@testing-library/jest-dom";
import "../../../../../test/resetNextMocks";

describe("DataTable", () => {
  const rows = [
    { id: 1, name: "Charlie" },
    { id: 2, name: "Alice" },
    { id: 3, name: "Bob" },
  ];
  const columns: Column<(typeof rows)[number]>[] = [
    { header: "Name", render: (row) => row.name },
  ];

  it("renders sorted rows when order changes", () => {
    const { rerender } = render(<DataTable rows={rows} columns={columns} />);
    expect(screen.getAllByRole("cell").map((c) => c.textContent)).toEqual([
      "Charlie",
      "Alice",
      "Bob",
    ]);

    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    rerender(<DataTable rows={sorted} columns={columns} />);
    expect(screen.getAllByRole("cell").map((c) => c.textContent)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("renders current page of rows", () => {
    const { rerender } = render(
      <DataTable rows={rows.slice(0, 2)} columns={columns} />
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    rerender(<DataTable rows={rows.slice(2)} columns={columns} />);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
  });

  it("allows selecting rows with click and checkbox", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        onSelectionChange={handleChange}
      />
    );

    const firstRow = screen.getAllByRole("row")[1];
    fireEvent.click(firstRow);
    expect(handleChange).toHaveBeenNthCalledWith(1, [rows[0]]);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(handleChange).toHaveBeenNthCalledWith(2, [rows[0], rows[1]]);

    fireEvent.click(checkboxes[0]);
    expect(handleChange).toHaveBeenNthCalledWith(3, [rows[1]]);
  });
});

