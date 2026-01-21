// src/components/checkins/__tests__/DocInsertButton.test.tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DocInsertButton from "../DocInsertButton";
import type { CheckInRow } from "../../../types/component/CheckinRow";

// Mock next/navigation
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const baseBooking: CheckInRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
};

describe("DocInsertButton", () => {
  beforeEach(() => {
    pushMock.mockReset();
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
    expect(pushMock).toHaveBeenCalledWith(
      "/doc-insert?bookingRef=BR1&occupantId=O1&selectedDate=2025-01-01"
    );
  });
});
