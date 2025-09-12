import { fireEvent, render, screen } from "@testing-library/react";
import DataTable, { type Column } from "../DataTable";

const rows = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
const columns: Column<(typeof rows)[number]>[] = [
  { header: "ID", render: (row) => row.id },
  { header: "Name", render: (row) => row.name },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable rows={rows} columns={columns} />);
    columns.forEach((col) => {
      expect(
        screen.getByRole("columnheader", { name: col.header })
      ).toBeInTheDocument();
    });
  });

  it("toggles selection when selectable", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        onSelectionChange={handleChange}
      />
    );

    const rowElements = screen.getAllByRole("row");
    fireEvent.click(rowElements[1]);
    expect(handleChange).toHaveBeenNthCalledWith(1, [rows[0]]);
    expect(
      (screen.getAllByRole("checkbox")[0] as HTMLInputElement).checked
    ).toBe(true);

    fireEvent.click(rowElements[2]);
    expect(handleChange).toHaveBeenNthCalledWith(2, [rows[0], rows[1]]);
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes[1].checked).toBe(true);

    fireEvent.click(rowElements[1]);
    expect(handleChange).toHaveBeenNthCalledWith(3, [rows[1]]);
    expect(checkboxes[0].checked).toBe(false);
  });

  it("ignores clicks when not selectable", () => {
    const handleChange = jest.fn();
    render(<DataTable rows={rows} columns={columns} onSelectionChange={handleChange} />);

    const rowElements = screen.getAllByRole("row");
    fireEvent.click(rowElements[1]);
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});
