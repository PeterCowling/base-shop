import path from "node:path";

jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
}));

describe("resolveDataRoot", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("walks up directories to find an existing data/shops folder", async () => {
    const startDir = path.join("/a", "b", "c");
    const expected = path.join("/a", "data", "shops");

    jest.spyOn(process, "cwd").mockReturnValue(startDir);
    const fs = await import("node:fs");
    const existsMock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    existsMock.mockImplementation((p) => p === expected);

    const { resolveDataRoot } = await import("../src/dataRoot");
    const dir = resolveDataRoot();

    expect(dir).toBe(expected);
    expect(existsMock).toHaveBeenCalledWith(path.join(startDir, "data", "shops"));
    expect(existsMock).toHaveBeenCalledWith(
      path.join(path.dirname(startDir), "data", "shops"),
    );
    expect(existsMock).toHaveBeenCalledWith(expected);
  });

  it("falls back to <cwd>/data/shops when traversal fails", async () => {
    const startDir = path.join("/x", "y", "z");
    const expected = path.resolve(startDir, "data", "shops");

    jest.spyOn(process, "cwd").mockReturnValue(startDir);
    const fs = await import("node:fs");
    const existsMock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    existsMock.mockReturnValue(false);

    const { resolveDataRoot } = await import("../src/dataRoot");
    const dir = resolveDataRoot();

    expect(dir).toBe(expected);
    expect(existsMock).toHaveBeenCalled();
  });
});
