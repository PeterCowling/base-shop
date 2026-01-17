import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import DataTable, { type Column } from "@acme/ui/components/cms/DataTable";

interface Row {
  id: number;
  name: string;
  age: number;
}

const rows: Row[] = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Carol", age: 35 },
];

const columns: Column<Row>[] = [
  { header: "Name", render: (r) => <span>{r.name}</span> },
  { header: "Age", render: (r) => <span data-cy={`age-${r.id}`}>{r.age}</span> },
];

describe("DataTable", () => {
  it("fires selection callbacks and highlights selected rows", () => {
    const handleChange = jest.fn();
    render(
      <DataTable
        rows={rows}
        columns={columns}
        selectable
        onSelectionChange={handleChange}
      />
    );

    const bobRow = screen.getByText("Bob").closest("tr") as HTMLElement;
    const checkbox = bobRow.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;

    expect(bobRow.getAttribute("data-state")).toBeNull();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(bobRow);
    expect(bobRow.getAttribute("data-state")).toBe("selected");
    expect(checkbox.checked).toBe(true);
    expect(handleChange).toHaveBeenLastCalledWith([rows[1]]);

    fireEvent.click(bobRow);
    expect(bobRow.getAttribute("data-state")).toBeNull();
    expect(checkbox.checked).toBe(false);
    expect(handleChange).toHaveBeenLastCalledWith([]);
  });

  it("toggles sort order between ascending and descending", () => {
    function Wrapper() {
      const [dir, setDir] = useState<"asc" | "desc">("asc");
      const sorted = [...rows].sort((a, b) =>
        dir === "asc" ? a.age - b.age : b.age - a.age
      );
      return (
        <>
          <button onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}>
            sort
          </button>
          <DataTable rows={sorted} columns={columns} />
        </>
      );
    }

    render(<Wrapper />);

    const getFirstAge = () => screen.getAllByTestId(/age-/)[0];

    expect(getFirstAge()).toHaveTextContent("25");
    fireEvent.click(screen.getByText("sort"));
    expect(getFirstAge()).toHaveTextContent("35");
    fireEvent.click(screen.getByText("sort"));
    expect(getFirstAge()).toHaveTextContent("25");
  });
});

