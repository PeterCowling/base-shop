import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Extension from "../Extension";

jest.mock("../modals/ExtensionPayModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-cy="pay-modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

const bookingsMock = jest.fn();
jest.mock("../../../hooks/data/useBookingsData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => bookingsMock(...args),
}));

const guestDetailsMock = jest.fn();
jest.mock("../../../hooks/data/useGuestDetails", () => ({
  __esModule: true,
  default: (...args: unknown[]) => guestDetailsMock(...args),
}));

const guestByRoomMock = jest.fn();
jest.mock("../../../hooks/data/useGuestByRoom", () => ({
  __esModule: true,
  default: (...args: unknown[]) => guestByRoomMock(...args),
}));

const financialsRoomMock = jest.fn();
jest.mock("../../../hooks/data/useFinancialsRoom", () => ({
  __esModule: true,
  default: (...args: unknown[]) => financialsRoomMock(...args),
}));

const activitiesMock = jest.fn();
jest.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => activitiesMock(...args),
}));

const cityTaxMock = jest.fn();
jest.mock("../../../hooks/data/useCityTax", () => ({
  __esModule: true,
  default: (...args: unknown[]) => cityTaxMock(...args),
}));

const roomConfigsMock = jest.fn();
jest.mock("../../../hooks/client/checkin/useRoomConfigs", () => ({
  __esModule: true,
  default: () => ({ getBedCount: (...args: unknown[]) => roomConfigsMock(...args) }),
}));

jest.mock("../../../utils/dateUtils", () => {
  const actual = jest.requireActual("../../../utils/dateUtils");
  return {
    ...actual,
    getLocalToday: () => "2024-05-02",
    isToday: (d: string) => d === "2024-05-02",
  };
});

describe("Extension", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bookingsMock.mockReturnValue({
      bookings: {
        b1: {
          o1: {
            checkInDate: "2024-05-01",
            checkOutDate: "2024-05-03",
            roomNumbers: ["101"],
          },
        },
      },
      loading: false,
      error: null,
    });
    guestDetailsMock.mockReturnValue({
      guestsDetails: { b1: { o1: { firstName: "Alice", lastName: "Smith" } } },
      loading: false,
      error: null,
      validationError: null,
    });
    guestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" } },
      loading: false,
      error: null,
    });
    financialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 } },
      loading: false,
      error: null,
    });
    activitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    cityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    roomConfigsMock.mockReturnValue(1);
  });

  it("shows loading state", () => {
    bookingsMock.mockReturnValue({ bookings: {}, loading: true, error: null });
    render(<Extension />);
    expect(screen.getByText(/Loading extension data/)).toBeInTheDocument();
  });

  it("shows error state", () => {
    bookingsMock.mockReturnValue({ bookings: {}, loading: false, error: "boom" });
    render(<Extension />);
    expect(screen.getByText(/Error loading data: boom/)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    bookingsMock.mockReturnValue({ bookings: {}, loading: false, error: null });
    render(<Extension />);
    expect(screen.getByText(/No guests in house/)).toBeInTheDocument();
  });

  it("renders rows and opens modal", async () => {
    bookingsMock.mockReturnValue({
      bookings: {
        b1: {
          o1: {
            checkInDate: "2024-05-01",
            checkOutDate: "2024-05-03",
            roomNumbers: ["101"],
          },
        },
      },
      loading: false,
      error: null,
    });
    guestDetailsMock.mockReturnValue({
      guestsDetails: { b1: { o1: { firstName: "Alice", lastName: "Smith" } } },
      loading: false,
      error: null,
      validationError: null,
    });
    guestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" } },
      loading: false,
      error: null,
    });
    financialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 } },
      loading: false,
      error: null,
    });
    activitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    cityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    roomConfigsMock.mockReturnValue(1);
    render(<Extension />);
    expect(screen.getByText("101")).toBeInTheDocument();
    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "2");
    expect(input).toHaveValue(2);
    await userEvent.click(screen.getByRole("button", { name: "Guest" }));
    expect(screen.getByTestId("pay-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("close"));
    expect(screen.queryByTestId("pay-modal")).toBeNull();
  });

  it("filters rows based on search input", async () => {
    bookingsMock.mockReturnValue({
      bookings: {
        b1: {
          o1: {
            checkInDate: "2024-05-01",
            checkOutDate: "2024-05-03",
            roomNumbers: ["101"],
          },
        },
        b2: {
          o2: {
            checkInDate: "2024-05-01",
            checkOutDate: "2024-05-03",
            roomNumbers: ["202"],
          },
        },
      },
      loading: false,
      error: null,
    });
    guestDetailsMock.mockReturnValue({
      guestsDetails: {
        b1: { o1: { firstName: "Alice", lastName: "Smith" } },
        b2: { o2: { firstName: "Bob", lastName: "Jones" } },
      },
      loading: false,
      error: null,
      validationError: null,
    });
    guestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" }, o2: { allocated: "202" } },
      loading: false,
      error: null,
    });
    financialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 }, b2: { totalPaid: 200 } },
      loading: false,
      error: null,
    });
    activitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    cityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    roomConfigsMock.mockReturnValue(1);

    render(<Extension />);
    const searchInput = screen.getByLabelText("Search");
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("202")).toBeInTheDocument();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "Alice");
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.queryByText("202")).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "ZZZ");
    expect(screen.getByText(/No guests match your search/i)).toBeInTheDocument();
  });
});
