import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import TableHeader from "../TableHeader";

describe("TableHeader", () => {
  it("renders column titles with icons", () => {
    const { container } = render(
      <table>
        <TableHeader />
      </table>
    );

    const columns = [
      "Guest Name",
      "Room Allocated",
      "Room Payment",
      "City Tax",
      "Keycard Deposit",
      "Status",
      "Document Insert",
      "Email Booking",
    ];

    columns.forEach((title) => {
      const headerCell = screen.getByTitle(title);
      expect(headerCell).toBeInTheDocument();
      // Lucide icons render as SVG elements
      expect(headerCell.querySelector("svg")).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
