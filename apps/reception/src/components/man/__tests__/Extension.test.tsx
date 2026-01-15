import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../modals/ExtensionPayModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pay-modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

const useBookingsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useBookingsData", () => ({
  __esModule: true,
  default: useBookingsMock,
}));

const useGuestDetailsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useGuestDetails", () => ({
  __esModule: true,
  default: useGuestDetailsMock,
}));

const useGuestByRoomMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useGuestByRoom", () => ({
  __esModule: true,
  default: useGuestByRoomMock,
}));

const useFinancialsRoomMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useFinancialsRoom", () => ({
  __esModule: true,
  default: useFinancialsRoomMock,
}));

const useActivitiesMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useActivitiesByCodeData", () => ({
  __esModule: true,
  default: useActivitiesMock,
}));

const useCityTaxMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/data/useCityTax", () => ({
  __esModule: true,
  default: useCityTaxMock,
}));

const useRoomConfigsMock = vi.hoisted(() => vi.fn());
vi.mock("../../../hooks/client/checkin/useRoomConfigs", () => ({
  __esModule: true,
  default: () => ({ getBedCount: useRoomConfigsMock }),
}));

vi.mock("../../../utils/dateUtils", async () => {
  const actual = await vi.importActual<
    typeof import("../../../utils/dateUtils")
  >("../../../utils/dateUtils");
  return {
    ...actual,
    getLocalToday: () => "2024-05-02",
    isToday: (d: string) => d === "2024-05-02",
  };
});

import Extension from "../Extension";

describe("Extension", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookingsMock.mockReturnValue({
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
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: { b1: { o1: { firstName: "Alice", lastName: "Smith" } } },
      loading: false,
      error: null,
      validationError: null,
    });
    useGuestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" } },
      loading: false,
      error: null,
    });
    useFinancialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 } },
      loading: false,
      error: null,
    });
    useActivitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    useCityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    useRoomConfigsMock.mockReturnValue(1);
  });

  it("shows loading state", () => {
    useBookingsMock.mockReturnValue({ bookings: {}, loading: true, error: null });
    render(<Extension />);
    expect(screen.getByText(/Loading extension data/)).toBeInTheDocument();
  });

  it("shows error state", () => {
    useBookingsMock.mockReturnValue({ bookings: {}, loading: false, error: "boom" });
    render(<Extension />);
    expect(screen.getByText(/Error loading data: boom/)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    useBookingsMock.mockReturnValue({ bookings: {}, loading: false, error: null });
    render(<Extension />);
    expect(screen.getByText(/No guests in house/)).toBeInTheDocument();
  });

  it("renders rows and opens modal", async () => {
    useBookingsMock.mockReturnValue({
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
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: { b1: { o1: { firstName: "Alice", lastName: "Smith" } } },
      loading: false,
      error: null,
      validationError: null,
    });
    useGuestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" } },
      loading: false,
      error: null,
    });
    useFinancialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 } },
      loading: false,
      error: null,
    });
    useActivitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    useCityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    useRoomConfigsMock.mockReturnValue(1);
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
    useBookingsMock.mockReturnValue({
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
    useGuestDetailsMock.mockReturnValue({
      guestsDetails: {
        b1: { o1: { firstName: "Alice", lastName: "Smith" } },
        b2: { o2: { firstName: "Bob", lastName: "Jones" } },
      },
      loading: false,
      error: null,
      validationError: null,
    });
    useGuestByRoomMock.mockReturnValue({
      guestByRoom: { o1: { allocated: "101" }, o2: { allocated: "202" } },
      loading: false,
      error: null,
    });
    useFinancialsRoomMock.mockReturnValue({
      financialsRoom: { b1: { totalPaid: 100 }, b2: { totalPaid: 200 } },
      loading: false,
      error: null,
    });
    useActivitiesMock.mockReturnValue({
      activitiesByCodes: { "14": {} },
      loading: false,
      error: null,
    });
    useCityTaxMock.mockReturnValue({
      cityTax: {},
      loading: false,
      error: null,
    });
    useRoomConfigsMock.mockReturnValue(1);

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
