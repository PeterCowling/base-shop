
import "@testing-library/jest-dom";

import { bookingNoteSchema } from "../bookingNoteSchema";

describe("bookingNoteSchema", () => {
  it("accepts valid booking notes", () => {
    const result = bookingNoteSchema.safeParse({
      text: "note text",
      timestamp: "123456",
      user: "user1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when fields are missing or wrong type", () => {
    expect(
      bookingNoteSchema.safeParse({ text: 1, timestamp: "t", user: "u" })
        .success
    ).toBe(false);
    expect(
      bookingNoteSchema.safeParse({ timestamp: "t", user: "u" }).success
    ).toBe(false);
    expect(bookingNoteSchema.safeParse({ text: "", user: "u" }).success).toBe(
      false
    );
    expect(
      bookingNoteSchema.safeParse({ text: "", timestamp: "t" }).success
    ).toBe(false);
  });
});
