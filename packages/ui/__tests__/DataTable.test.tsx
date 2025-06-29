import { fireEvent, render, screen } from "@testing-library/react";
import DataTable, { type Column } from "../components/cms/DataTable";

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
    render: (row) => <span data-testid={`name-${row.name}`}>{row.name}</span>,
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

  it("toggles row selection and calls onSelectionChange", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        onSelectionChange={handleChange}
      />
    );

    const aliceRow = screen.getByText("Alice").closest("tr") as HTMLElement;
    const aliceCheckbox = aliceRow.querySelector(
      "input[type=checkbox]"
    ) as HTMLInputElement;

    expect(aliceRow.getAttribute("data-state")).toBeNull();
    expect(aliceCheckbox.checked).toBe(false);

    fireEvent.click(aliceRow);
    expect(aliceRow.getAttribute("data-state")).toBe("selected");
    expect(aliceCheckbox.checked).toBe(true);
    expect(handleChange).toHaveBeenLastCalledWith([rows[0]]);

    fireEvent.click(aliceRow);
    expect(aliceRow.getAttribute("data-state")).toBeNull();
    expect(aliceCheckbox.checked).toBe(false);
    expect(handleChange).toHaveBeenLastCalledWith([]);
  });

  it("applies column widths", () => {
    render(<DataTable rows={rows} columns={columns} />);
    const nameHeader = screen.getByText("Name").closest("th") as HTMLElement;
    expect(nameHeader.style.width).toBe("150px");
  });
});
