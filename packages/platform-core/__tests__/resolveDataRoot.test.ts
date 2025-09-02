import path from "node:path";

jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
}));

describe("resolveDataRoot", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.DATA_ROOT;
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

  it("uses DATA_ROOT override when provided", async () => {
    process.env.DATA_ROOT = "/custom/data";
    const fs = await import("node:fs");
    const existsMock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    const { resolveDataRoot } = await import("../src/dataRoot");
    const dir = resolveDataRoot();

    expect(dir).toBe(path.resolve("/custom/data"));
    expect(existsMock).not.toHaveBeenCalled();
  });

  it("resolves relative DATA_ROOT using path.resolve", async () => {
    process.env.DATA_ROOT = "./relative/data";
    const fs = await import("node:fs");
    const existsMock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    const { resolveDataRoot } = await import("../src/dataRoot");
    const dir = resolveDataRoot();

    expect(dir).toBe(path.resolve("./relative/data"));
    expect(existsMock).not.toHaveBeenCalled();
  });

  it("falls back immediately when starting at filesystem root", async () => {
    const startDir = "/";
    const expected = path.resolve("/", "data", "shops");

    jest.spyOn(process, "cwd").mockReturnValue(startDir);
    const fs = await import("node:fs");
    const existsMock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    existsMock.mockReturnValue(false);

    const { resolveDataRoot } = await import("../src/dataRoot");
    existsMock.mockClear();
    const dir = resolveDataRoot();

    expect(dir).toBe(expected);
    expect(existsMock).toHaveBeenCalledTimes(1);
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
    existsMock.mockClear();
    const dir = resolveDataRoot();

    const calls = existsMock.mock.calls.map(([p]) => p);
    const expectedCalls: string[] = [];
    let current = startDir;
    while (true) {
      expectedCalls.push(path.join(current, "data", "shops"));
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    expect(dir).toBe(expected);
    expect(calls).toEqual(expectedCalls);
  });
});
