import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

describe("Table", () => {
  it("renders with header and body and wraps table in overflow container", () => {
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

  it("applies custom className to TableHeader", () => {
    const { container } = render(
      <table>
        <TableHeader className="custom-header">
          <tr />
        </TableHeader>
      </table>
    );
    const header = container.querySelector("thead");
    expect(header).toHaveClass("bg-muted/50", "border-b", "custom-header");
  });

  it("applies custom className to TableBody", () => {
    const { container } = render(
      <table>
        <TableBody className="custom-body">
          <tr />
        </TableBody>
      </table>
    );
    const body = container.querySelector("tbody");
    expect(body).toHaveClass("custom-body");
  });

  it("applies custom className to TableRow", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow className="custom-row">
            <td />
          </TableRow>
        </tbody>
      </table>
    );
    const row = container.querySelector("tr");
    expect(row).toHaveClass(
      "hover:bg-muted/25",
      "data-[state=selected]:bg-muted",
      "border-b",
      "transition-colors",
      "custom-row"
    );
  });

  it("applies selected-state classes when data-state=\"selected\"", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow data-state="selected" />
        </tbody>
      </table>
    );
    const row = container.querySelector("tr");
    expect(row).toHaveAttribute("data-state", "selected");
    expect(row).toHaveClass("data-[state=selected]:bg-muted");
  });

  it("applies custom className to TableHead", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead className="custom-head">Head</TableHead>
          </tr>
        </thead>
      </table>
    );
    const head = container.querySelector("th");
    expect(head).toHaveClass(
      "text-foreground",
      "px-4",
      "py-2",
      "font-semibold",
      "custom-head"
    );
  });

  it("applies custom className to TableCell", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell className="custom-cell">Cell</TableCell>
          </tr>
        </tbody>
      </table>
    );
    const cell = container.querySelector("td");
    expect(cell).toHaveClass("px-4", "py-2", "align-middle", "custom-cell");
  });
});
