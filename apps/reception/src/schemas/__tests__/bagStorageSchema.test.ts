
import "@testing-library/jest-dom";
import { bagStorageSchema } from "../bagStorageSchema";

describe("bagStorageSchema", () => {
  it("parses a valid bag storage record map", () => {
    expect(() =>
      bagStorageSchema.parse({
        abc: { optedIn: true },
      })
    ).not.toThrow();
  });

  it("fails when optedIn is missing", () => {
    expect(() => bagStorageSchema.parse({ abc: {} })).toThrow();
  });

  it("fails when optedIn is not boolean", () => {
    expect(() =>
      bagStorageSchema.parse({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abc: { optedIn: "true" as any },
      })
    ).toThrow();
  });
});
