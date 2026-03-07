import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type CheckInRow } from "../../../types/component/CheckinRow";
import StatusButton from "../StatusButton";

/* eslint-disable no-var */
var addActivityMock: jest.Mock;
var removeLastActivityMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  addActivityMock = jest.fn().mockResolvedValue({ success: true });
  removeLastActivityMock = jest.fn().mockResolvedValue({ success: true });
  return {
    __esModule: true,
    default: () => ({
      addActivity: addActivityMock,
      removeLastActivity: removeLastActivityMock,
      loading: false,
    }),
  };
});

function makeBooking(overrides: Partial<CheckInRow> = {}): CheckInRow {
  return {
    bookingRef: "BR-1",
    occupantId: "occ-1",
    checkInDate: "2026-03-05",
    rooms: ["101"],
    activities: [],
    ...overrides,
  };
}

describe("StatusButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("advances to bags-dropped when mutation succeeds", async () => {
    render(<StatusButton booking={makeBooking()} />);

    const button = screen.getByRole("button", { name: /status: pending/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(addActivityMock).toHaveBeenCalledWith("occ-1", 23);
    });
    expect(
      screen.getByRole("button", { name: /status: bags dropped/i })
    ).toBeInTheDocument();
  });

  it("reverts optimistic status when mutation reports success=false", async () => {
    addActivityMock.mockResolvedValueOnce({
      success: false,
      error: "write-failed",
    });

    render(<StatusButton booking={makeBooking()} />);

    const button = screen.getByRole("button", { name: /status: pending/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(addActivityMock).toHaveBeenCalledWith("occ-1", 23);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /status: pending/i })
      ).toBeInTheDocument();
    });
  });
});
