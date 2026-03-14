/* eslint-disable ds/no-raw-color -- test fixtures */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import type { GridReservationRow } from "../../../hooks/data/roomgrid/useGridData";
import OccupancyStrip, { computeOccupancyCount } from "../OccupancyStrip";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function makeRow(
  room: string,
  start: string,
  end: string,
  status: string
): GridReservationRow {
  return {
    id: `${room}-row`,
    title: "Bed #1",
    info: "",
    startDate: start,
    endDate: end,
    periods: [
      {
        start,
        end,
        status: status as GridReservationRow["periods"][0]["status"],
        bookingRef: "BR1",
        occupantId: "OCC1",
        firstName: "Test",
        lastName: "Guest",
        info: "",
        color: "#fff",
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* computeOccupancyCount unit tests                                           */
/* -------------------------------------------------------------------------- */

describe("computeOccupancyCount", () => {
  const today = "2025-06-10";

  // TC-01: rooms with bookings overlapping today and occupied statuses
  it("TC-01: counts rooms with occupied bookings overlapping today", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-09", "2025-06-12", "12")],
      "4": [makeRow("4", "2025-06-10", "2025-06-11", "8")],
      "5": [], // empty
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3", "4", "5"], get, today)).toBe(2);
  });

  // TC-02: all rooms occupied
  it("TC-02: counts all rooms when all are occupied", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-09", "2025-06-12", "1")],
      "4": [makeRow("4", "2025-06-08", "2025-06-15", "12")],
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3", "4"], get, today)).toBe(2);
  });

  // TC-03: no rooms occupied
  it("TC-03: returns 0 when no rooms have occupied bookings today", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-11", "2025-06-13", "12")], // future
      "4": [], // empty
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3", "4"], get, today)).toBe(0);
  });

  // TC-07: status "16" (bags picked up) is NOT counted as occupied
  it("TC-07: does not count status 16 as occupied", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-09", "2025-06-12", "16")],
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3"], get, today)).toBe(0);
  });

  // TC-07b: status "free" is NOT counted as occupied
  it("TC-07b: does not count status free as occupied", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-09", "2025-06-12", "free")],
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3"], get, today)).toBe(0);
  });

  // TC-08: status "14" (checkout complete) IS counted as occupied
  it("TC-08: counts status 14 (checkout complete) as occupied", () => {
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-09", "2025-06-12", "14")],
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3"], get, today)).toBe(1);
  });

  it("does not count a booking whose period ends on today (exclusive end)", () => {
    // end === today means checkout is today — guest departed, period does not include today
    const dataMap: Record<string, GridReservationRow[]> = {
      "3": [makeRow("3", "2025-06-08", "2025-06-10", "12")], // end === today → exclusive
    };
    const get = (room: string) => dataMap[room] ?? [];
    expect(computeOccupancyCount(["3"], get, today)).toBe(0);
  });

  it("returns 0 for empty room list", () => {
    const get = (_room: string) => [];
    expect(computeOccupancyCount([], get, today)).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* OccupancyStrip render tests                                                */
/* -------------------------------------------------------------------------- */

describe("OccupancyStrip", () => {
  it("renders occupied count and total rooms", () => {
    render(<OccupancyStrip occupiedCount={7} totalRooms={10} />);
    expect(screen.getByText("Occupied tonight:")).toBeInTheDocument();
    expect(screen.getByText("7 / 10 rooms")).toBeInTheDocument();
  });

  it("renders zero occupied count", () => {
    render(<OccupancyStrip occupiedCount={0} totalRooms={10} />);
    expect(screen.getByText("0 / 10 rooms")).toBeInTheDocument();
  });

  it("renders full-house (all occupied)", () => {
    render(<OccupancyStrip occupiedCount={10} totalRooms={10} />);
    expect(screen.getByText("10 / 10 rooms")).toBeInTheDocument();
  });
});
