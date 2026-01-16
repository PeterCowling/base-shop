/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
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
      { title: "Guest Name", icon: "fa-user" },
      { title: "Room Allocated", icon: "fa-bed" },
      { title: "Room Payment", icon: "fa-credit-card" },
      { title: "City Tax", icon: "fa-coins" },
      { title: "Keycard Deposit", icon: "fa-key" },
      { title: "Status", icon: "fa-clock" },
      { title: "Document Insert", icon: "fa-file-alt" },
      { title: "Email Booking", icon: "fa-envelope" },
    ];

    columns.forEach(({ title, icon }) => {
      const headerCell = screen.getByTitle(title);
      expect(headerCell).toBeInTheDocument();
      expect(headerCell.querySelector(`.${icon}`)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
