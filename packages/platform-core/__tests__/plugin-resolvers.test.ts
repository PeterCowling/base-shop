import path from "node:path";
import { exportsToCandidates } from "../src/plugins/resolvers";

describe("exportsToCandidates", () => {
  it("returns path for string exports", () => {
    const dir = "/test";
    const candidates = exportsToCandidates(dir, "./dist/index.js");
    expect(candidates).toEqual([path.resolve(dir, "./dist/index.js")]);
  });

  it("returns paths for object exports", () => {
    const dir = "/test";
    const exportsField = {
      ".": {
        import: "./dist/index.mjs",
        default: "./dist/index.js",
        require: "./dist/index.cjs",
      },
    };
    const candidates = exportsToCandidates(dir, exportsField);
    expect(candidates).toEqual([
      path.resolve(dir, "./dist/index.mjs"),
      path.resolve(dir, "./dist/index.js"),
      path.resolve(dir, "./dist/index.cjs"),
    ]);
  });

  it("returns empty array for malformed exports", () => {
    const candidates = exportsToCandidates("/test", 42 as unknown);
    expect(candidates).toEqual([]);
  });

  it("dedupes duplicate paths", () => {
    const dir = "/test";
    const exportsField = {
      ".": {
        import: "./dist/index.js",
        default: "./dist/index.js",
        require: "./dist/index.js",
      },
    };
    const candidates = exportsToCandidates(dir, exportsField);
    expect(candidates).toEqual([path.resolve(dir, "./dist/index.js")]);
  });
});
