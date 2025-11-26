// apps/skylar/src/lib/__tests__/joinClasses.test.ts
import { joinClasses } from "../joinClasses";

describe("joinClasses", () => {
  it("joins strings and filters falsy values", () => {
    expect(joinClasses("foo", undefined, "bar", "", false, "baz")).toBe(
      "foo bar baz",
    );
  });

  it("returns an empty string when nothing is provided", () => {
    expect(joinClasses()).toBe("");
  });
});

