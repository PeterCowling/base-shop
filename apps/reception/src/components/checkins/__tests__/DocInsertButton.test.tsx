// src/components/checkins/__tests__/DocInsertButton.test.tsx
/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DocInsertButton from "../DocInsertButton";
import type { CheckInRow } from "../../../types/component/CheckinRow";

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

const baseBooking: CheckInRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
};

describe("DocInsertButton", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("shows primary styling when no document data is present", () => {
    render(<DocInsertButton booking={baseBooking} selectedDate="2025-01-01" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary-main");
    expect(button).toHaveAttribute("title", "Insert occupant document data.");
  });

  it("shows warning styling when some document data is present", () => {
    const partialBooking: CheckInRow = {
      ...baseBooking,
      docNumber: "123",
    };
    render(<DocInsertButton booking={partialBooking} selectedDate="2025-01-01" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-warning-main");
    expect(button).toHaveAttribute("title", "Insert occupant document data.");
  });

  it("shows success styling when all document data is complete", () => {
    const completeBooking: CheckInRow = {
      ...baseBooking,
      docNumber: "ABC",
      citizenship: "IT",
      placeOfBirth: "Rome",
      dateOfBirth: { dd: "01", mm: "02", yyyy: "2000" },
    };
    render(<DocInsertButton booking={completeBooking} selectedDate="2025-01-01" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-success-main");
    expect(button).toHaveAttribute(
      "title",
      "Document data collected — click to review or edit."
    );
  });

  it("navigates with booking information on click", async () => {
    render(<DocInsertButton booking={baseBooking} selectedDate="2025-01-01" />);
    await userEvent.click(screen.getByRole("button"));
    expect(navigateMock).toHaveBeenCalledWith("/doc-insert", {
      state: {
        bookingRef: "BR1",
        occupantId: "O1",
        selectedDate: "2025-01-01",
      },
    });
  });
});

