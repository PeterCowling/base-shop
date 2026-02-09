import { render, screen } from "@testing-library/react";

import { useGuestBookingSnapshot } from "../../../../hooks/dataOrchestrator/useGuestBookingSnapshot";
import BookingDetailsPage from "../page";

jest.mock("../../../../hooks/dataOrchestrator/useGuestBookingSnapshot", () => ({
  useGuestBookingSnapshot: jest.fn(),
}));

function buildSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    bookingId: "BOOK123",
    guestUuid: "occ_1234567890123",
    guestName: "Jane Doe",
    reservationCode: "BOOK123",
    checkInDate: "2099-02-10",
    checkOutDate: "2099-02-12",
    roomNumbers: ["3A"],
    roomAssignment: "3A",
    isCheckedIn: false,
    arrivalState: "pre-arrival",
    preorders: {},
    bagStorage: null,
    requestSummary: {},
    ...overrides,
  };
}

describe("BookingDetailsPage status mapping", () => {
  const mockedUseGuestBookingSnapshot = useGuestBookingSnapshot as jest.MockedFunction<
    typeof useGuestBookingSnapshot
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: future check-in renders pre-arrival status", () => {
    mockedUseGuestBookingSnapshot.mockReturnValue({
      snapshot: buildSnapshot({
        checkInDate: "2099-02-10",
        checkOutDate: "2099-02-12",
        isCheckedIn: false,
      }) as any,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      token: "token-1",
    });

    render(<BookingDetailsPage />);
    expect(screen.getByText("Pre-arrival")).toBeDefined();
  });

  it("TC-03: checked-in signal renders checked-in status", () => {
    mockedUseGuestBookingSnapshot.mockReturnValue({
      snapshot: buildSnapshot({
        checkInDate: "2000-02-10",
        checkOutDate: "2099-02-12",
        isCheckedIn: true,
        requestSummary: {
          extension: {
            requestId: "extension_1",
            status: "approved",
          },
        },
      }) as any,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      token: "token-1",
    });

    render(<BookingDetailsPage />);
    expect(screen.getByText("Checked in")).toBeDefined();
    expect(screen.getByText("Breakfast order")).toBeDefined();
    expect(screen.getByText(/Current extension request status:/)).toBeDefined();
  });

  it("TC-04: past checkout shows checked-out state and hides in-stay actions", () => {
    mockedUseGuestBookingSnapshot.mockReturnValue({
      snapshot: buildSnapshot({
        checkInDate: "2000-02-01",
        checkOutDate: "2000-02-02",
        isCheckedIn: false,
      }) as any,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      token: "token-1",
    });

    render(<BookingDetailsPage />);
    expect(screen.getByText("Checked out")).toBeDefined();
    expect(screen.queryByText("Breakfast order")).toBeNull();
    expect(screen.getByText("Request bag drop")).toBeDefined();
  });
});
