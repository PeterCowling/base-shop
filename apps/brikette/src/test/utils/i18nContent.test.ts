
import "@testing-library/jest-dom";
import {
  ensureArray,
  ensureStringArray,
  ensureStringArrayPreserveWhitespace,
} from "@/utils/i18nContent";

describe("ensureStringArray", () => {
  it("preserves whitespace for string entries while filtering empties", () => {
    expect(ensureStringArray(["  one  ", null, 42, ""]).join(",")).toBe("  one  ,42");
  });

  it("wraps a scalar value in an array without trimming strings", () => {
    expect(ensureStringArray("  hello  ")).toEqual(["  hello  "]);
  });

  it("returns an empty array for nullish inputs", () => {
    expect(ensureStringArray(undefined)).toEqual([]);
    expect(ensureStringArray(null)).toEqual([]);
    expect(ensureStringArray("")).toEqual([]);
  });

  it("stringifies non-string inputs while trimming blanks", () => {
    expect(ensureStringArray(["foo", 0, false, "   ", { value: "bar" }])).toEqual([
      "foo",
      "0",
      "false",
      "[object Object]",
    ]);
  });

  it("handles singular non-string values by stringifying", () => {
    expect(ensureStringArray(42)).toEqual(["42"]);
  });
});

describe("ensureArray", () => {
  it("returns the provided array when value is already an array", () => {
    const value = [1, 2, 3];
    expect(ensureArray<number>(value)).toBe(value);
  });

  it("returns an empty array for non-array inputs", () => {
    expect(ensureArray<number>(undefined)).toEqual([]);
    expect(ensureArray<number>("nope")).toEqual([]);
  });
});

describe("ensureStringArrayPreserveWhitespace", () => {
  it("keeps translator-provided spacing but filters empty-like entries", () => {
    expect(
      ensureStringArrayPreserveWhitespace(["  padded  ", "", null, "line\n", 10]),
    ).toEqual(["  padded  ", "line\n", "10"]);
  });

  it("drops scalars that resolve to empty strings", () => {
    expect(ensureStringArrayPreserveWhitespace({})).toEqual([]);
  });
});