import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

// hoisted mocks to avoid ReferenceError when mocking
const useActivitiesByCodeDataMock = jest.fn();
const usePreorderMock = jest.fn();
const useBookingsDataMock = jest.fn();
const useGuestDetailsMock = jest.fn();
const useGuestsByBookingMock = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));
jest.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  default: useActivitiesByCodeDataMock,
}));
jest.mock("../../../hooks/data/usePreorder", () => ({
  default: usePreorderMock,
}));
jest.mock("../../../hooks/data/useBookingsData", () => ({
  default: useBookingsDataMock,
}));
jest.mock("../../../hooks/data/useGuestDetails", () => ({
  default: useGuestDetailsMock,
}));
jest.mock("../../../hooks/data/useGuestsByBooking", () => ({
  default: useGuestsByBookingMock,
}));
jest.mock("../ModalPreorderDetails", () => ({
  __esModule: true,
  default: ({ preorder }: { preorder: unknown }) => (
    <div data-testid="modal">{JSON.stringify(preorder)}</div>
  ),
}));

import CompScreen from "../CompScreen";

describe("CompScreen preorder modal", () => {
  afterEach(() => {
    jest.clearAllMocks();
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

