import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import BagStoragePage from "../page";

const useGuestBookingSnapshotMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("@/hooks/dataOrchestrator/useGuestBookingSnapshot", () => ({
  useGuestBookingSnapshot: () => useGuestBookingSnapshotMock(),
}));

describe("BagStoragePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("TC-01: checked-out status renders request form and successful submit state", async () => {
    const refetchMock = jest.fn(async () => undefined);
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        arrivalState: "checked-out",
        bagStorage: null,
        requestSummary: {},
      },
      token: "token-1",
      isLoading: false,
      refetch: refetchMock,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Bag-drop request submitted." }),
    });

    render(<BagStoragePage />);
    fireEvent.change(screen.getByLabelText("Pickup window"), {
      target: { value: "16:00-18:00" },
    });
    fireEvent.change(screen.getByLabelText("Note (optional)"), {
      target: { value: "Will collect before dinner." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request bag drop" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/bag-drop-request",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "token-1",
            pickupWindow: "16:00-18:00",
            note: "Will collect before dinner.",
          }),
        }),
      );
      expect(screen.getByText("Bag-drop request submitted.")).toBeInTheDocument();
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-02: checked-in status renders guidance state with no submit action", () => {
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        arrivalState: "checked-in",
        bagStorage: null,
        requestSummary: {},
      },
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<BagStoragePage />);
    expect(
      screen.getByText(
        "Bag-drop requests become available after checkout. Please return once your stay is checked out.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request bag drop" })).not.toBeInTheDocument();
  });

  it("TC-03: missing snapshot renders fallback state", () => {
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: null,
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<BagStoragePage />);
    expect(
      screen.getByText("We could not load bag-storage details right now."),
    ).toBeInTheDocument();
  });
});
