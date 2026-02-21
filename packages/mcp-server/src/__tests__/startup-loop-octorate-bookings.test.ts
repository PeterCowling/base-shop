/** @jest-environment node */

import {
  aggregateBookingsByChannel,
  dedupeReservationsByReferGlobal,
  deriveChannelFromRefer,
  getLastCompleteCheckInMonths,
  type OctorateReservation,
} from "../startup-loop/octorate-bookings";

describe("startup-loop octorate bookings", () => {
  function r(
    refer: string,
    createTime: Date,
    checkIn: Date,
    totalRoom: number,
    room = "",
  ): OctorateReservation {
    return { refer, createTime, checkIn, totalRoom, room };
  }

  it("TC-01: dedupe by Refer is global and canonical selection is deterministic", () => {
    const reservations: OctorateReservation[] = [
      // Booking.com: later createTime should win.
      r("1234567890", new Date(2025, 1, 5), new Date(2025, 2, 10), 100, "OTA, Refundable, Room 1"),
      r("1234567890", new Date(2025, 1, 6), new Date(2025, 2, 10), 110, "OTA, Refundable, Room 1"),

      // Direct: same createTime, highest totalRoom should win.
      r("ABC123", new Date(2025, 2, 1), new Date(2025, 2, 15), 80, "Room 2"),
      r("ABC123", new Date(2025, 2, 1), new Date(2025, 2, 15), 85, "Room 2"),
    ];

    const deduped = dedupeReservationsByReferGlobal(reservations);

    const booking = deduped.find((x) => x.refer === "1234567890");
    expect(booking?.totalRoom).toBe(110);

    const direct = deduped.find((x) => x.refer === "ABC123");
    expect(direct?.totalRoom).toBe(85);
  });

  it("TC-02: month attribution uses Check in month (not Create time)", () => {
    const reservations: OctorateReservation[] = [
      // Create time in Feb, check-in in Mar.
      r("1234567890", new Date(2025, 1, 28), new Date(2025, 2, 2), 50, "OTA, Refundable, Room 1"),
    ];

    const rows = aggregateBookingsByChannel(reservations, { asOfIso: "2026-02-15" });

    const row = rows.find((x) => x.month === "2025-03" && x.channel === "Booking.com");
    expect(row?.bookings).toBe(1);
    expect(row?.gross_value).toBe(50);
    expect(row?.notes).toMatch(/month_by=check_in/);
  });

  it("TC-03: unknown Refer patterns do not map to Hostelworld", () => {
    expect(deriveChannelFromRefer("EXPEDIA-1")).toBe("Unknown");
    expect(deriveChannelFromRefer("7763-HW1")).toBe("Hostelworld");
  });

  it("TC-04: window selection for as-of 2026-02-15 yields 2025-02..2026-01 and excludes future months", () => {
    const months = getLastCompleteCheckInMonths("2026-02-15", 12);
    expect(months[0]).toBe("2025-02");
    expect(months[months.length - 1]).toBe("2026-01");
    expect(months).toHaveLength(12);

    const reservations: OctorateReservation[] = [
      r("9999999999", new Date(2026, 1, 1), new Date(2026, 1, 5), 200, "OTA"), // Feb 2026 (excluded)
      r("EXPEDIA-1", new Date(2025, 4, 1), new Date(2025, 4, 20), 90, "OTA"), // May 2025 (included)
    ];

    const rows = aggregateBookingsByChannel(reservations, { asOfIso: "2026-02-15" });

    const feb26 = rows.find((x) => x.month === "2026-02" && x.channel === "Booking.com");
    expect(feb26).toBeUndefined();

    // Unknown channel exists in-window so Unknown rows should be present.
    const unknownMay = rows.find((x) => x.month === "2025-05" && x.channel === "Unknown");
    expect(unknownMay?.bookings).toBe(1);
    expect(unknownMay?.gross_value).toBe(90);
    expect(unknownMay?.notes).toMatch(/not_available_from_export=true/);
  });
});
