
import "@testing-library/jest-dom";

import clsx from "../clsx";

describe("clsx", () => {
  it("combines strings and object entries", () => {
    expect(clsx("foo", { bar: true, baz: false })).toBe("foo bar");
  });

  it("includes array indexes for truthy values", () => {
    // @ts-expect-error arrays are not part of the public API
    expect(clsx(["a", null, "c"])).toBe("0 2");
  });

  it("ignores falsy values", () => {
    expect(clsx("", undefined, null, false, { nope: false })).toBe("");
  });
});

