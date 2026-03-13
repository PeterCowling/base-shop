
import "@testing-library/jest-dom";

import { fridgeStorageRecordSchema, fridgeStorageSchema } from "../fridgeStorageSchema";

describe("fridgeStorageRecordSchema", () => {
  it("parses a valid record with used: true", () => {
    expect(() =>
      fridgeStorageRecordSchema.parse({ used: true })
    ).not.toThrow();
  });

  it("parses a valid record with used: false", () => {
    expect(() =>
      fridgeStorageRecordSchema.parse({ used: false })
    ).not.toThrow();
  });

  it("fails when used is missing", () => {
    expect(() => fridgeStorageRecordSchema.parse({})).toThrow();
  });

  it("fails when used is not boolean", () => {
    expect(() =>
      fridgeStorageRecordSchema.parse({ used: "yes" as unknown as boolean })
    ).toThrow();
  });
});

describe("fridgeStorageSchema", () => {
  it("parses a valid fridge storage map", () => {
    expect(() =>
      fridgeStorageSchema.parse({ occ_123: { used: false } })
    ).not.toThrow();
  });

  it("parses a multi-occupant map", () => {
    expect(() =>
      fridgeStorageSchema.parse({
        occ_123: { used: false },
        occ_456: { used: true },
      })
    ).not.toThrow();
  });

  it("parses an empty map", () => {
    expect(() => fridgeStorageSchema.parse({})).not.toThrow();
  });

  it("fails when a record has invalid shape", () => {
    expect(() =>
      fridgeStorageSchema.parse({ occ_123: { used: "no" as unknown as boolean } })
    ).toThrow();
  });
});
