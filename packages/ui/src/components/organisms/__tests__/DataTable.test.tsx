/* i18n-exempt file -- tests use literal copy for assertions */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTable } from "../DataTable";

type Row = { id: number; name: string };

const rows: Row[] = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Bravo" },
  { id: 3, name: "Charlie" },
];

const columns = [
  { header: "ID", render: (r: Row) => r.id },
  { header: "Name", render: (r: Row) => r.name },
];

describe("DataTable", () => {
  it("renders headers and rows", () => {
    render(<DataTable rows={rows} columns={columns} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("toggles selection via row click and notifies onSelectionChange", async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(
      <DataTable rows={rows} columns={columns} selectable onSelectionChange={onSelectionChange} />
    );

    const rowAlpha = screen.getByText("Alpha").closest("tr")!;
    await user.click(rowAlpha);
    expect(rowAlpha).toHaveAttribute("data-state", "selected");
    expect(onSelectionChange).toHaveBeenLastCalledWith([{ id: 1, name: "Alpha" }]);

    const rowCharlie = screen.getByText("Charlie").closest("tr")!;
    await user.click(rowCharlie);
    expect(rowCharlie).toHaveAttribute("data-state", "selected");
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      { id: 1, name: "Alpha" },
      { id: 3, name: "Charlie" },
    ]);

    // Toggle Alpha off
    await user.click(rowAlpha);
    expect(rowAlpha).not.toHaveAttribute("data-state", "selected");
    expect(onSelectionChange).toHaveBeenLastCalledWith([{ id: 3, name: "Charlie" }]);
  });

  it("checkbox toggles selection without propagating row click", async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(
      <DataTable rows={rows} columns={columns} selectable onSelectionChange={onSelectionChange} />
    );

    const rowBravo = screen.getByText("Bravo").closest("tr")!;
    const checkbox = rowBravo.querySelector('input[type="checkbox"]') as HTMLInputElement;

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(rowBravo).toHaveAttribute("data-state", "selected");
    expect(onSelectionChange).toHaveBeenLastCalledWith([{ id: 2, name: "Bravo" }]);

    // Clicking checkbox again should unselect but not double toggle via row
    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(rowBravo).not.toHaveAttribute("data-state", "selected");
  });

  it("does not toggle when selectable=false", async () => {
    const user = userEvent.setup();
    render(<DataTable rows={rows} columns={columns} selectable={false} />);
    const rowAlpha = screen.getByText("Alpha").closest("tr")!;
    await user.click(rowAlpha);
    expect(rowAlpha).not.toHaveAttribute("data-state");
  });

  it("generates keys for rows without id or key fields", () => {
    const setSpy = jest.spyOn(WeakMap.prototype, "set");
    try {
      render(
        <DataTable
          rows={[{ name: "Anon" }, { name: "Beta" }]}
          columns={[{ header: "Name", render: (row: { name: string }) => row.name }]}
        />
      );
      expect(setSpy).toHaveBeenCalled();
    } finally {
      setSpy.mockRestore();
    }
  });

  it("stringifies primitive rows to derive keys", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <DataTable
          rows={["One", "Two"]}
          columns={[{ header: "Value", render: (value: string) => value }]}
        />
      );
      expect(screen.getByText("One")).toBeInTheDocument();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
