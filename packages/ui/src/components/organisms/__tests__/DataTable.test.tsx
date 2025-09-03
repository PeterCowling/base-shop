import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, type Column } from "../DataTable";
import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

describe("DataTable", () => {
  const rows = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];
  const columns: Column<(typeof rows)[number]>[] = [
    { header: "Name", render: (row) => row.name },
  ];

  it("renders without checkbox column when not selectable", () => {
    render(<DataTable rows={rows} columns={columns} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("handles row and checkbox selection", () => {
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

    const secondCheckbox = screen.getAllByRole("checkbox")[1];
    fireEvent.click(secondCheckbox);
    expect(handleChange).toHaveBeenNthCalledWith(2, [rows[0], rows[1]]);

    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);
    expect(handleChange).toHaveBeenNthCalledWith(3, [rows[1]]);
  });
});

