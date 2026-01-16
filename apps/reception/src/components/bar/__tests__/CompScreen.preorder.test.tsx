import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// hoisted mocks to avoid ReferenceError when mocking
const useActivitiesByCodeDataMock = vi.hoisted(() => vi.fn());
const usePreorderMock = vi.hoisted(() => vi.fn());
const useBookingsDataMock = vi.hoisted(() => vi.fn());
const useGuestDetailsMock = vi.hoisted(() => vi.fn());
const useGuestsByBookingMock = vi.hoisted(() => vi.fn());

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));
vi.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  default: useActivitiesByCodeDataMock,
}));
vi.mock("../../../hooks/data/usePreorder", () => ({
  default: usePreorderMock,
}));
vi.mock("../../../hooks/data/useBookingsData", () => ({
  default: useBookingsDataMock,
}));
vi.mock("../../../hooks/data/useGuestDetails", () => ({
  default: useGuestDetailsMock,
}));
vi.mock("../../../hooks/data/useGuestsByBooking", () => ({
  default: useGuestsByBookingMock,
}));
vi.mock("../ModalPreorderDetails", () => ({
  __esModule: true,
  default: ({ preorder }: { preorder: unknown }) => (
    <div data-testid="modal">{JSON.stringify(preorder)}</div>
  ),
}));

import CompScreen from "../CompScreen";

describe("CompScreen preorder modal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("displays preorder details when a row is double-clicked", async () => {
    useActivitiesByCodeDataMock.mockReturnValue({
      activitiesByCodes: { "12": { occ1: {} } },
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
    fireEvent.dblClick(row);
    expect(await screen.findByTestId("modal")).toHaveTextContent("Cooked");
  });
});

