import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CompScreen from "../CompScreen";

// ------------------------------------------------------------------
// Mock dependencies
// ------------------------------------------------------------------

const useActivitiesByCodeDataMock = vi.fn();
vi.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  default: useActivitiesByCodeDataMock,
}));

const usePreorderMock = vi.fn();
vi.mock("../../../hooks/data/usePreorder", () => ({
  default: usePreorderMock,
}));

const useBookingsDataMock = vi.fn();
vi.mock("../../../hooks/data/useBookingsData", () => ({
  default: useBookingsDataMock,
}));

const useGuestDetailsMock = vi.fn();
vi.mock("../../../hooks/data/useGuestDetails", () => ({
  default: useGuestDetailsMock,
}));

const useGuestsByBookingMock = vi.fn();
vi.mock("../../../hooks/data/useGuestsByBooking", () => ({
  default: useGuestsByBookingMock,
}));

vi.mock("../ModalPreorderDetails", () => ({
  __esModule: true,
  default: ({ guestName }: { guestName: string }) => (
    <div data-testid="modal">Modal for {guestName}</div>
  ),
}));

// ------------------------------------------------------------------

describe("CompScreen", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader while data is loading", () => {
    useActivitiesByCodeDataMock.mockReturnValue({
      activitiesByCodes: {},
      loading: true,
      error: null,
    });
    usePreorderMock.mockReturnValue({ preorder: null, loading: true, error: null });
    useBookingsDataMock.mockReturnValue({ bookings: {}, loading: true, error: null });
    useGuestDetailsMock.mockReturnValue({ guestsDetails: {}, loading: true, error: null, validationError: null });
    useGuestsByBookingMock.mockReturnValue({ guestsByBooking: null, loading: true, error: null });

    render(<CompScreen />);
    expect(document.querySelector("svg.animate-spin")).toBeInTheDocument();
    expect(screen.queryByText(/Eligible/i)).not.toBeInTheDocument();
  });

  it("renders eligible and non-eligible rows", async () => {
    useActivitiesByCodeDataMock.mockReturnValue({
      activitiesByCodes: { "12": { occ1: {}, occ2: {} }, "13": {}, "14": {} },
      loading: false,
      error: null,
    });
    usePreorderMock.mockReturnValue({
      preorder: {
        occ1: { night1: { breakfast: "Cooked", drink1: "NA", drink2: "NA" } },
        occ2: { night1: { breakfast: "NA", drink1: "NA", drink2: "NA" } },
      },
      loading: false,
      error: null,
    });
    useBookingsDataMock.mockReturnValue({
      bookings: {
        BR1: {
          occ1: { checkInDate: "2025-01-01" },
          occ2: { checkInDate: "2025-01-01" },
        },
      },
      loading: false,
      error: null,
    });
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: {
        BR1: {
          occ1: { firstName: "Alice", lastName: "A" },
          occ2: { firstName: "Bob", lastName: "B" },
        },
      },
      loading: false,
      error: null,
      validationError: null,
    });
    useGuestsByBookingMock.mockReturnValue({
      guestsByBooking: { occ1: { reservationCode: "BR1" }, occ2: { reservationCode: "BR1" } },
      loading: false,
      error: null,
    });

    render(<CompScreen />);

    expect(await screen.findByText("Eligible")).toBeInTheDocument();
    expect(screen.getByText("Alice A")).toBeInTheDocument();
    expect(screen.getByText("Bob B")).toBeInTheDocument();
  });

  it("opens modal on row double click", async () => {
    useActivitiesByCodeDataMock.mockReturnValue({
      activitiesByCodes: { "12": { occ1: {} }, "13": {}, "14": {} },
      loading: false,
      error: null,
    });
    usePreorderMock.mockReturnValue({
      preorder: {
        occ1: { night1: { breakfast: "Cooked", drink1: "NA", drink2: "NA" } },
      },
      loading: false,
      error: null,
    });
    useBookingsDataMock.mockReturnValue({
      bookings: { BR1: { occ1: { checkInDate: "2025-01-01" } } },
      loading: false,
      error: null,
    });
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: { BR1: { occ1: { firstName: "Alice", lastName: "A" } } },
      loading: false,
      error: null,
      validationError: null,
    });
    useGuestsByBookingMock.mockReturnValue({
      guestsByBooking: { occ1: { reservationCode: "BR1" } },
      loading: false,
      error: null,
    });

    render(<CompScreen />);
    const row = await screen.findByText("Alice A");
    await userEvent.dblClick(row);
    expect(screen.getByTestId("modal")).toHaveTextContent("Modal for Alice A");
  });
});
