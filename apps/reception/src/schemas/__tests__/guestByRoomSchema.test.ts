
import "@testing-library/jest-dom";
import { guestByRoomRecordSchema } from "../guestByRoomSchema";

describe("guestByRoomRecordSchema", () => {
  it("parses allocated and booked strings", () => {
    expect(() =>
      guestByRoomRecordSchema.parse({ allocated: "101", booked: "201" })
    ).not.toThrow();
  });

  it("rejects non-string values", () => {
    expect(() =>
      guestByRoomRecordSchema.parse({
        allocated: 1 as unknown as string,
        booked: "2",
      })
    ).toThrow();
    expect(() =>
      guestByRoomRecordSchema.parse({
        allocated: "1",
        booked: 2 as unknown as string,
      })
    ).toThrow();
  });
});
