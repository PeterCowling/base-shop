const { parseDsPackage } = require("../ds-package-schema");

describe("ds-package-schema", () => {
  it("parses tokens", () => {
    const ds = parseDsPackage({ tokens: { color: "#fff" } });
    expect(ds.tokens.color).toBe("#fff");
  });

  it("throws on invalid package", () => {
    expect(() => parseDsPackage({})).toThrow();
  });
});
