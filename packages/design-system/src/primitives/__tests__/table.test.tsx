import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

describe("Table", () => {
  it("renders with header and body and wraps table in overflow container", async () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Cell")).toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass("w-full", "overflow-x-auto");

  });

  it("merges classes and forwards ref for Table", () => {
    const ref = React.createRef<HTMLTableElement>();
    render(
      <Table ref={ref} className="custom-table">
        <TableBody />
      </Table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
    expect(ref.current).toHaveClass(
      "text-foreground",
      "w-full",
      "text-left",
      "text-sm",
      "custom-table"
    );
  });

  it("merges classes and forwards ref for TableHeader", () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    const { container } = render(
      <table>
        <TableHeader ref={ref} className="custom-header">
          <tr />
        </TableHeader>
      </table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    const header = container.querySelector("thead");
    expect(header).toHaveClass("bg-panel", "border-b", "border-border-2", "custom-header");
  });

  it("merges classes and forwards ref for TableBody", () => {
    const ref = React.createRef<HTMLTableSectionElement>();
    const { container } = render(
      <table>
        <TableBody ref={ref} className="custom-body">
          <tr />
        </TableBody>
      </table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    const body = container.querySelector("tbody");
    expect(body).toHaveClass("custom-body");
  });

  it("merges classes, forwards ref for TableRow, and applies selected state", () => {
    const ref = React.createRef<HTMLTableRowElement>();
    const { container } = render(
      <table>
        <tbody>
          <TableRow
            ref={ref}
            className="custom-row"
            data-state="selected"
          >
            <td />
          </TableRow>
        </tbody>
      </table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
    const row = container.querySelector("tr");
    expect(row).toHaveAttribute("data-state", "selected");
    expect(row).toHaveClass(
      "hover:bg-surface-2",
      "data-[state=selected]:bg-surface-3",
      "border-b",
      "border-border-1",
      "transition-colors",
      "custom-row"
    );
  });

  it("merges classes and forwards ref for TableHead", () => {
    const ref = React.createRef<HTMLTableCellElement>();
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead ref={ref} className="custom-head">
              Head
            </TableHead>
          </tr>
        </thead>
      </table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    const head = container.querySelector("th");
    expect(head).toHaveClass(
      "text-foreground",
      "px-4",
      "py-2",
      "font-semibold",
      "custom-head"
    );
  });

  it("merges classes and forwards ref for TableCell", () => {
    const ref = React.createRef<HTMLTableCellElement>();
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell ref={ref} className="custom-cell">
              Cell
            </TableCell>
          </tr>
        </tbody>
      </table>
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    const cell = container.querySelector("td");
    expect(cell).toHaveClass("px-4", "py-2", "align-middle", "custom-cell");
  });

  it("forwards refs to underlying DOM nodes", () => {
    const tableRef = React.createRef<HTMLTableElement>();
    const rowRef = React.createRef<HTMLTableRowElement>();
    const headRef = React.createRef<HTMLTableCellElement>();
    const cellRef = React.createRef<HTMLTableCellElement>();

    render(
      <Table ref={tableRef}>
        <TableHeader>
          <TableRow ref={rowRef}>
            <TableHead ref={headRef}>Head</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell ref={cellRef}>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(rowRef.current).toBeInstanceOf(HTMLTableRowElement);
    expect(headRef.current).toBe(screen.getByText("Head"));
    expect(cellRef.current).toBe(screen.getByText("Cell"));
  });

  it("forwards arbitrary attributes through primitives", () => {
    render(
      <Table id="tbl" role="grid">
        <TableHeader>
          <TableRow id="row" role="row">
            <TableHead id="head" role="columnheader">
              Head
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell id="cell" role="gridcell">
              Cell
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole("grid")).toHaveAttribute("id", "tbl");
    expect(screen.getAllByRole("row")[0]).toHaveAttribute("id", "row");
    expect(screen.getByRole("columnheader")).toHaveAttribute("id", "head");
    expect(screen.getByRole("gridcell")).toHaveAttribute("id", "cell");
  });
});
