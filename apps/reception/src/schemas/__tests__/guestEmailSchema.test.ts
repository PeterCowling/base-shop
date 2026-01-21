
import "@testing-library/jest-dom";
import { GuestEmailRecord } from "../guestEmailSchema";

describe("GuestEmailRecord", () => {
  it("parses with or without an email", () => {
    expect(() => GuestEmailRecord.parse({})).not.toThrow();
    expect(() =>
      GuestEmailRecord.parse({ email: "test@example.com" })
    ).not.toThrow();
  });

  it("fails when extra fields are present", () => {
    expect(() =>
      GuestEmailRecord.parse({ email: "a@b.com", foo: "bar" })
    ).toThrow();
  });
});
