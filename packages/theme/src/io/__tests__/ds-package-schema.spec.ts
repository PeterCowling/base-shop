/* eslint-disable ds/no-raw-color -- TEST-123: test fixtures use literal hex strings to validate schemas */
import { externalDsSchema, parseDsPackage } from "../ds-package-schema";

describe("ds-package-schema", () => {
  it("parses multiple tokens", () => {
    const ds = parseDsPackage({ tokens: { color: "#fff", size: "12px" } });
    expect(ds.tokens).toEqual({ color: "#fff", size: "12px" });
  });

  it("throws on invalid package", () => {
    expect(() => parseDsPackage({})).toThrow();
  });

  it("throws when token value is not a string", () => {
    expect(() => parseDsPackage({ tokens: { size: 12 } })).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() => parseDsPackage({ tokens: { color: "#fff" }, extra: true })).toThrow();
  });

  it("exposes the underlying zod schema", () => {
    const result = externalDsSchema.parse({ tokens: { color: "#000" } });
    expect(result).toEqual({ tokens: { color: "#000" } });
  });
});
