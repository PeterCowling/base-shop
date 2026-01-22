
import "@testing-library/jest-dom";

import type { CheckInRow } from "../../types/component/CheckinRow";
import { sortCheckinsData } from "../sortCheckins";

const makeActivity = (code: number) => ({ code, who: "tester" });

describe("sortCheckinsData", () => {
  it("orders rows by booking status weight then room number", () => {
    const data: CheckInRow[] = [
      {
        bookingRef: "B1",
        occupantId: "1",
        checkInDate: "2024-01-01",
        rooms: ["201"],
        roomAllocated: "201",
        activities: [],
      },
      {
        bookingRef: "B2",
        occupantId: "2",
        checkInDate: "2024-01-01",
        rooms: ["102"],
        roomAllocated: "102",
        activities: [makeActivity(23), makeActivity(12)],
      },
      {
        bookingRef: "B3",
        occupantId: "3",
        checkInDate: "2024-01-01",
        rooms: ["103"],
        roomAllocated: "103",
        activities: [makeActivity(23)],
      },
      {
        bookingRef: "B4",
        occupantId: "4",
        checkInDate: "2024-01-01",
        rooms: ["101"],
        roomAllocated: "101",
        activities: [],
      },
    ];

    const sorted = sortCheckinsData(data);
    const order = sorted.map((r) => r.bookingRef);
    expect(order).toEqual(["B4", "B1", "B3", "B2"]);
  });
});
