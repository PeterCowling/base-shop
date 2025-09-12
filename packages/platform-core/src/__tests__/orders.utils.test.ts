/** @jest-environment node */

import { normalize } from "../orders/utils";

describe("orders/utils", () => {
  it("returns null when given null", () => {
    expect(normalize(null)).toBeNull();
  });

  it("replaces null property values with undefined", () => {
    const input = { foo: "bar", baz: null } as any;
    const result = normalize(input);
    expect(result).toEqual({ foo: "bar", baz: undefined });
  });
});
