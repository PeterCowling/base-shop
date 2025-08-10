import path from "node:path";
import { resolveDataRoot } from "../src/dataRoot";

describe("resolveDataRoot", () => {
  it("points to the monorepo data/shops directory", () => {
    const dir = resolveDataRoot();
    const expected = path.resolve(__dirname, "..", "..", "..", "data", "shops");
    expect(dir).toBe(expected);
  });
});
