import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import useRoomConfigs from "../../../client/checkin/useRoomConfigs";
import useActivitiesData from "../useActivitiesData";
import useBookingsData from "../useBookingsData";
import useGridData, {
  type GridReservationRow,
  packBookingsIntoRows,
  type TBookingPeriod,
} from "../useGridData";
import useGuestByRoomData from "../useGuestByRoomData";
import useGuestsDetailsData from "../useGuestsDetailsData";

jest.mock("../useBookingsData");
jest.mock("../useGuestByRoomData");
jest.mock("../useGuestsDetailsData");
jest.mock("../useActivitiesData");
jest.mock("../../../client/checkin/useRoomConfigs");

const mockedBookings = jest.mocked(useBookingsData);
const mockedGuestByRoom = jest.mocked(useGuestByRoomData);
const mockedGuestsDetails = jest.mocked(useGuestsDetailsData);
const mockedActivities = jest.mocked(useActivitiesData);
const mockedRoomConfigs = jest.mocked(useRoomConfigs);

const stubGuest = (firstName: string, lastName: string) => ({
  citizenship: "",
  dateOfBirth: { dd: "", mm: "", yyyy: "" },
  document: { number: "", type: "" },
  email: "",
  firstName,
  gender: "",
  language: "",
  lastName,
  municipality: "",
  placeOfBirth: "",
});

describe("utility functions", () => {
  it("packs bookings without overlap", () => {
    const p = (start: string, end: string): TBookingPeriod => ({
      start,
      end,
      status: "1",
      bookingRef: "b",
      occupantId: "o",
      firstName: "F",
      lastName: "L",
      info: "",
      color: "c",
    });
    const bookings: GridReservationRow[] = [
      {
        id: "b1",
        title: "",
        info: "",
        startDate: "2025-05-01",
        endDate: "2025-05-03",
        periods: [p("2025-05-01", "2025-05-03")],
      },
      {
        id: "b2",
        title: "",
        info: "",
        startDate: "2025-05-02",
        endDate: "2025-05-05",
        periods: [p("2025-05-02", "2025-05-05")],
      },
      {
        id: "b3",
        title: "",
        info: "",
        startDate: "2025-05-06",
        endDate: "2025-05-07",
        periods: [p("2025-05-06", "2025-05-07")],
      },
    ];

    const rows = packBookingsIntoRows(bookings, 2);

    expect(rows).toHaveLength(2);
    expect(rows[0].periods).toHaveLength(2);
    expect(rows[1].periods).toHaveLength(1);
    expect(rows[0].id).toBe("bed-1");
    expect(rows[1].id).toBe("bed-2");
  });
});

describe("useGridData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns packed rows for a room", () => {
    mockedRoomConfigs.mockReturnValue({
      knownRooms: ["101"],
      getBedCount: () => 2,
      getMaxGuestsPerBed: () => 1,
    });

    mockedBookings.mockReturnValue({
      bookingsData: {
        BR1: {
          OCC1: {
            checkInDate: "2025-05-01",
            checkOutDate: "2025-05-03",
            leadGuest: true,
            roomNumbers: ["101"],
          },
        },
        BR2: {
          OCC2: {
            checkInDate: "2025-05-02",
            checkOutDate: "2025-05-05",
            leadGuest: false,
            roomNumbers: ["101"],
          },
        },
        BR3: {
          OCC3: {
            checkInDate: "2025-05-06",
            checkOutDate: "2025-05-07",
            leadGuest: false,
            roomNumbers: ["101"],
          },
        },
      },
      loading: false,
      error: null,
    });

    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: {
        OCC1: { allocated: "101", booked: "101" },
        OCC2: { allocated: "101", booked: "101" },
        OCC3: { allocated: "101", booked: "101" },
      },
      loading: false,
      error: null,
    });

    mockedGuestsDetails.mockReturnValue({
      guestsDetailsData: {
        BR1: {
          OCC1: stubGuest("Alice", "A"),
        },
        BR2: {
          OCC2: stubGuest("Bob", "B"),
        },
        BR3: {
          OCC3: stubGuest("Carl", "C"),
        },
      },
      loading: false,
      error: null,
    });

    mockedActivities.mockReturnValue({
      activitiesData: {
        OCC1: {
          a1: { code: 12, timestamp: "2025-05-01T00:00:00Z", who: "u" },
        },
        OCC2: {
          a1: { code: 99, timestamp: "2025-05-02T00:00:00Z", who: "u" },
        },
      },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useGridData("2025-05-01", "2025-05-10")
    );

    const rows = result.current.getReservationDataForRoom("101");

    expect(rows).toHaveLength(2);
    expect(rows[0].periods).toHaveLength(2);
    expect(rows[1].periods).toHaveLength(1);
    expect(rows[0].periods[0].status).toBe("12");
    expect(rows[0].periods[1].status).toBe("1"); // unknown activity
    expect(rows[1].periods[0].status).toBe("1");
  });
});
