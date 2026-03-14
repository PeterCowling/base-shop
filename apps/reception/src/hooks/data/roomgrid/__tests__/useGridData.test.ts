import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import useRoomConfigs from "../../../client/checkin/useRoomConfigs";
import useActivitiesData from "../useActivitiesData";
import useBookingsData from "../useBookingsData";
import useGridData, {
  type GridReservationRow,
  packBookingsIntoRows,
  type TBookingPeriod,
  type UnallocatedOccupant,
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

  it("ignores booking metadata entries when building room rows", () => {
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
          __notes: {
            note1: {
              text: "late arrival",
              timestamp: "2025-05-01T00:00:00.000Z",
              user: "Test",
            },
          },
        },
      },
      loading: false,
      error: null,
    });

    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: {
        OCC1: { allocated: "101", booked: "101" },
      },
      loading: false,
      error: null,
    });

    mockedGuestsDetails.mockReturnValue({
      guestsDetailsData: {
        BR1: {
          OCC1: stubGuest("Alice", "A"),
        },
      },
      loading: false,
      error: null,
    });

    mockedActivities.mockReturnValue({
      activitiesData: {},
      loading: false,
      error: null,
    });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderHook(() =>
      useGridData("2025-05-01", "2025-05-10")
    );

    const rows = result.current.getReservationDataForRoom("101");

    expect(rows).toHaveLength(1);
    expect(rows[0].periods).toHaveLength(1);
    expect(rows[0].periods[0].bookingRef).toBe("BR1");
    expect(rows[0].periods[0].occupantId).toBe("OCC1");
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
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

// ─── unallocatedOccupants tests ──────────────────────────────────────────────

const baseRoomConfigs = {
  knownRooms: ["3", "4", "5"],
  getBedCount: () => 2,
  getMaxGuestsPerBed: () => 1,
};

const baseBookingOccupant = (overrides: Partial<{
  checkInDate: string;
  checkOutDate: string;
  leadGuest: boolean;
  roomNumbers: string[];
}> = {}) => ({
  checkInDate: "2025-06-01",
  checkOutDate: "2025-06-05",
  leadGuest: true,
  roomNumbers: [],
  ...overrides,
});

const noActivities = { activitiesData: {}, loading: false, error: null };
const noDetails = { guestsDetailsData: {}, loading: false, error: null };

describe("useGridData — unallocatedOccupants", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC-01: absent allocated field → included in unallocatedOccupants
  it("TC-01: includes occupant with absent allocated field (booking in window)", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant() } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: {} }, // no allocated key
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    const unallocated: UnallocatedOccupant[] = result.current.unallocatedOccupants;

    expect(unallocated).toHaveLength(1);
    expect(unallocated[0].occupantId).toBe("OCC1");
    expect(unallocated[0].bookingRef).toBe("BR1");
  });

  // TC-02: blank allocated string → included
  it("TC-02: includes occupant with allocated === empty string (booking in window)", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant() } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: { allocated: "", booked: "6" } },
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants).toHaveLength(1);
    expect(result.current.unallocatedOccupants[0].occupantId).toBe("OCC1");
  });

  // TC-03: allocated value not in knownRooms → included
  it("TC-03: includes occupant with allocated value not in knownRooms", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant() } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: { allocated: "99" } }, // not in ["3","4","5"]
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants).toHaveLength(1);
  });

  // TC-04: booking outside date window → NOT included
  it("TC-04: excludes occupant with booking entirely outside the date window", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: {
        BR1: {
          OCC1: baseBookingOccupant({
            checkInDate: "2025-07-01",
            checkOutDate: "2025-07-05",
          }),
        },
      },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: {} }, // unallocated but outside window
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    // window is 2025-06-01 to 2025-06-10, booking is in July
    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants).toHaveLength(0);
  });

  // TC-09: bookedRoom present in guestByRoomData.booked
  it("TC-09: bookedRoom sourced from guestByRoomData.booked when present", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant({ roomNumbers: ["5"] }) } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: { booked: "6" } }, // booked present, no allocated
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants[0].bookedRoom).toBe("6");
  });

  // TC-10: bookedRoom falls back to bookingsData.roomNumbers[0] when guestByRoomData entry absent
  it("TC-10: bookedRoom falls back to bookingsData.roomNumbers[0] when guestByRoomData entry absent", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant({ roomNumbers: ["4"] }) } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: {}, // no entry for OCC1 at all
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants[0].bookedRoom).toBe("4");
  });

  // TC-11: activity code "23" (bag-drop) now maps to status "23" after precedence fix
  it("TC-11: occupant with activity code 23 (bag-drop) has status 23", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: { BR1: { OCC1: baseBookingOccupant() } },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: {} }, // unallocated
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue({
      activitiesData: {
        OCC1: {
          a1: { code: 23, timestamp: "2025-06-01T10:00:00Z", who: "staff" },
        },
      },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-10"));
    expect(result.current.unallocatedOccupants[0].status).toBe("23");
  });

  // Ordering: result sorted by checkInDate ascending
  it("returns unallocatedOccupants sorted by checkInDate ascending", () => {
    mockedRoomConfigs.mockReturnValue(baseRoomConfigs);
    mockedBookings.mockReturnValue({
      bookingsData: {
        BR2: { OCC2: baseBookingOccupant({ checkInDate: "2025-06-10", checkOutDate: "2025-06-15" }) },
        BR1: { OCC1: baseBookingOccupant({ checkInDate: "2025-06-01", checkOutDate: "2025-06-05" }) },
      },
      loading: false,
      error: null,
    });
    mockedGuestByRoom.mockReturnValue({
      guestByRoomData: { OCC1: {}, OCC2: {} },
      loading: false,
      error: null,
    });
    mockedGuestsDetails.mockReturnValue(noDetails);
    mockedActivities.mockReturnValue(noActivities);

    const { result } = renderHook(() => useGridData("2025-06-01", "2025-06-30"));
    const unallocated = result.current.unallocatedOccupants;
    expect(unallocated).toHaveLength(2);
    expect(unallocated[0].checkInDate).toBe("2025-06-01");
    expect(unallocated[1].checkInDate).toBe("2025-06-10");
  });
});
