import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import BookingDetailsPage from "../page";
import { useGuestBookingSnapshot } from "../../../../hooks/dataOrchestrator/useGuestBookingSnapshot";

jest.mock("../../../../hooks/dataOrchestrator/useGuestBookingSnapshot", () => ({
  useGuestBookingSnapshot: jest.fn(),
}));

describe("BookingDetailsPage extension request", () => {
  const mockedUseGuestBookingSnapshot = useGuestBookingSnapshot as jest.MockedFunction<
    typeof useGuestBookingSnapshot
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseGuestBookingSnapshot.mockReturnValue({
      snapshot: {
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
      } as any,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      token: "token-1",
    });
  });

  it("TC-05: submits extension request and shows confirmation", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Extension request sent.",
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    render(<BookingDetailsPage />);

    fireEvent.change(screen.getByLabelText("Requested check-out date"), {
      target: { value: "2099-02-13" },
    });
    fireEvent.change(screen.getByLabelText("Note (optional)"), {
      target: { value: "Need one extra night." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send extension request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByText("Extension request sent.")).toBeDefined();
    });
  });
});
