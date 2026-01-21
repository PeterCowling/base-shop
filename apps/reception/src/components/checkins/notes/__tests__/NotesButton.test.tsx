import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../BookingNotesModal", () => ({
  __esModule: true,
  default: () => <div data-testid="notes-modal" />,
}));

import BookingNotesButton from "../BookingNotesButton";

describe("BookingNotesButton", () => {
  it("opens notes modal on click", async () => {
    render(<BookingNotesButton bookingRef="BR123" />);
    expect(screen.queryByTestId("notes-modal")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("notes-modal")).toBeInTheDocument();
  });
});

