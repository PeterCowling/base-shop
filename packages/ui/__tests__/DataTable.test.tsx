import { fireEvent, render, screen } from "@testing-library/react";

import DataTable, { type Column } from "../src/components/cms/DataTable";

interface Row {
  name: string;
  age: number;
}

const rows: Row[] = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
];

const columns: Column<Row>[] = [
  {
    header: "Name",
    width: "150px",
    render: (row) => <span data-cy={`name-${row.name}`}>{row.name}</span>,
  },
  { header: "Age", render: (row) => <span>{row.age}</span> },
];

describe("DataTable", () => {
  it("renders headers and rows", () => {
    render(<DataTable rows={rows} columns={columns} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();

    expect(screen.getByTestId("name-Alice")).toHaveTextContent("Alice");
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("toggles multiple row selection and calls onSelectionChange", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        onSelectionChange={handleChange}
      />
    );

    const rowElements = screen.getAllByRole("row").slice(1); // skip header row
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];

    // select first row
    fireEvent.click(rowElements[0]);
    expect(handleChange).toHaveBeenNthCalledWith(1, [rows[0]]);
    expect(checkboxes[0].checked).toBe(true);

    // select second row
    fireEvent.click(rowElements[1]);
    expect(handleChange).toHaveBeenNthCalledWith(2, [rows[0], rows[1]]);
    expect(checkboxes[1].checked).toBe(true);

    // deselect first row
    fireEvent.click(rowElements[0]);
    expect(handleChange).toHaveBeenNthCalledWith(3, [rows[1]]);
    expect(checkboxes[0].checked).toBe(false);

    // deselect second row
    fireEvent.click(rowElements[1]);
    expect(handleChange).toHaveBeenNthCalledWith(4, []);
    expect(checkboxes[1].checked).toBe(false);
  });

  it("renders without selection when selectable is false", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable={false}
        onSelectionChange={handleChange}
      />
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    const aliceRow = screen.getByText("Alice").closest("tr") as HTMLElement;
    fireEvent.click(aliceRow);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies column widths", () => {
    render(<DataTable rows={rows} columns={columns} />);
    const nameHeader = screen.getByText("Name").closest("th") as HTMLElement;
    expect(nameHeader.style.width).toBe("150px");
  });
});
