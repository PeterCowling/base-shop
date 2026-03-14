/**
 * Tests for gap period detection in useGridData.
 *
 * Gap detection algorithm: consecutive free days (not covered by any booking period)
 * that are sandwiched between two booking periods, with a run length of 1–3 days,
 * are injected as synthetic periods with status "gap".
 */
import type { GridReservationRow, TBookingPeriod } from "../useGridData";
import { detectAndInjectGapPeriods } from "../useGridData";

function makeBookingPeriod(
  start: string,
  end: string,
  status: TBookingPeriod["status"] = "1"
): TBookingPeriod {
  return {
    start,
    end,
    status,
    bookingRef: "BR1",
    occupantId: "OCC1",
    firstName: "Test",
    lastName: "Guest",
    info: "Test booking",
    color: "blue",
  };
}

function makeRow(
  periods: TBookingPeriod[],
  id = "bed-1"
): GridReservationRow {
  return {
    id,
    title: "Bed #1",
    info: "",
    startDate: periods[0]?.start ?? "2025-01-01",
    endDate: periods[periods.length - 1]?.end ?? "2025-01-31",
    periods,
  };
}

describe("detectAndInjectGapPeriods", () => {
  // TC-01: single free day between two bookings → status "gap"
  it("TC-01: single free day between two bookings is marked as gap", () => {
    // Booking 1: 2025-06-01 to 2025-06-03 (nights: Jun 1, Jun 2)
    // Free day: 2025-06-03
    // Booking 2: 2025-06-04 to 2025-06-06 (nights: Jun 4, Jun 5)
    const row = makeRow([
      makeBookingPeriod("2025-06-01", "2025-06-03"),
      makeBookingPeriod("2025-06-04", "2025-06-06"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-06");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    expect(gapPeriods).toHaveLength(1);
    expect(gapPeriods[0].start).toBe("2025-06-03");
    expect(gapPeriods[0].info).toBe("Short gap");
  });

  // TC-02: 3 consecutive free days between two bookings → all 3 marked "gap"
  it("TC-02: 3 consecutive free days between bookings are all marked gap", () => {
    // Booking 1: Jun 1–3 (nights: Jun 1, Jun 2)
    // Free days: Jun 3, Jun 4, Jun 5
    // Booking 2: Jun 6–8
    const row = makeRow([
      makeBookingPeriod("2025-06-01", "2025-06-03"),
      makeBookingPeriod("2025-06-06", "2025-06-08"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-08");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    expect(gapPeriods).toHaveLength(3);
    expect(gapPeriods.map((p) => p.start)).toEqual([
      "2025-06-03",
      "2025-06-04",
      "2025-06-05",
    ]);
  });

  // TC-03: 4 consecutive free days between two bookings → NOT marked "gap"
  it("TC-03: 4+ consecutive free days between bookings are not marked gap", () => {
    // Booking 1: Jun 1–3
    // Free days: Jun 3, Jun 4, Jun 5, Jun 6 (4 days)
    // Booking 2: Jun 7–9
    const row = makeRow([
      makeBookingPeriod("2025-06-01", "2025-06-03"),
      makeBookingPeriod("2025-06-07", "2025-06-09"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-09");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    expect(gapPeriods).toHaveLength(0);
  });

  // TC-04: free days at start of range with no preceding booking → NOT "gap"
  it("TC-04: free days at start of date range without preceding booking are not gap", () => {
    // Range starts Jun 1; first booking starts Jun 5 → Jun 1–4 are free with no booking before
    const row = makeRow([
      makeBookingPeriod("2025-06-05", "2025-06-08"),
      makeBookingPeriod("2025-06-10", "2025-06-12"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-12");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    // The 3-day run Jun 1–4 has no booking before it → NOT gap
    // The run Jun 8–9 (2 days) IS sandwiched → IS gap
    const gapStarts = gapPeriods.map((p) => p.start);
    expect(gapStarts).not.toContain("2025-06-01");
    expect(gapStarts).not.toContain("2025-06-02");
    expect(gapStarts).not.toContain("2025-06-03");
    expect(gapStarts).not.toContain("2025-06-04");
    // Sandwiched gap Jun 8–9 should be marked
    expect(gapStarts).toContain("2025-06-08");
    expect(gapStarts).toContain("2025-06-09");
  });

  // TC-05: free days at end of date range with no following booking → NOT "gap"
  it("TC-05: free days at end of date range without following booking are not gap", () => {
    // Last booking ends Jun 5; range ends Jun 10 → Jun 5–10 are free with no booking after
    const row = makeRow([
      makeBookingPeriod("2025-06-01", "2025-06-03"),
      makeBookingPeriod("2025-06-04", "2025-06-05"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-10");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    // Jun 3 is sandwiched between the two bookings → IS gap (1 day)
    // Jun 5 onwards: no booking after → NOT gap
    const gapStarts = gapPeriods.map((p) => p.start);
    expect(gapStarts).toContain("2025-06-03");
    expect(gapStarts).not.toContain("2025-06-05");
    expect(gapStarts).not.toContain("2025-06-06");
    expect(gapStarts).not.toContain("2025-06-10");
  });

  // TC-06: row with fewer than 2 booking periods → no gap detection
  it("TC-06: row with single booking produces no gap periods", () => {
    const row = makeRow([
      makeBookingPeriod("2025-06-05", "2025-06-08"),
    ]);

    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-10");

    const gapPeriods = result[0].periods.filter((p) => p.status === "gap");
    expect(gapPeriods).toHaveLength(0);
  });

  // Extra: row with no periods is returned unchanged
  it("returns row with no periods unchanged", () => {
    const row = makeRow([]);
    const result = detectAndInjectGapPeriods([row], "2025-06-01", "2025-06-10");
    expect(result[0].periods).toHaveLength(0);
  });

  // Extra: empty date range produces no changes
  it("returns rows unchanged when date range is empty", () => {
    const row = makeRow([
      makeBookingPeriod("2025-06-01", "2025-06-03"),
      makeBookingPeriod("2025-06-05", "2025-06-07"),
    ]);
    const result = detectAndInjectGapPeriods([row], "2025-06-10", "2025-06-01");
    expect(result[0].periods.filter((p) => p.status === "gap")).toHaveLength(0);
  });
});
