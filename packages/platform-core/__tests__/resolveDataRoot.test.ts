import path from "node:path";

describe("resolveDataRoot", () => {
  afterEach(() => {
    delete process.env.DATA_ROOT;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("returns path.resolve(DATA_ROOT) when env is set without touching fs", async () => {
    const existsSync = jest.fn();
    jest.doMock("node:fs", () => ({ existsSync }));
    const actualPath = jest.requireActual("node:path");
    const resolveSpy = jest.fn(actualPath.resolve);
    jest.doMock("node:path", () => ({ ...actualPath, resolve: resolveSpy }));

    process.env.DATA_ROOT = "./custom/data";
    const { resolveDataRoot } = await import("../src/dataRoot");

    expect(resolveDataRoot()).toBe(actualPath.resolve("./custom/data"));
    expect(resolveSpy).toHaveBeenCalledWith("./custom/data");
    expect(existsSync).not.toHaveBeenCalled();
  });

  it("walks up directories to find the first data/shops", async () => {
    const existsSync = jest.fn((candidate: string) => candidate === "/repo/data/shops");
    jest.doMock("node:fs", () => ({ existsSync }));
    const actualPath = jest.requireActual("node:path");
    const joinSpy = jest.fn(actualPath.join);
    const dirnameSpy = jest.fn(actualPath.dirname);
    jest.doMock("node:path", () => ({ ...actualPath, join: joinSpy, dirname: dirnameSpy }));
    jest.spyOn(process, "cwd").mockReturnValue("/repo/packages/api");

    const { resolveDataRoot } = await import("../src/dataRoot");
    existsSync.mockClear();
    joinSpy.mockClear();
    dirnameSpy.mockClear();

    expect(resolveDataRoot()).toBe("/repo/data/shops");
    expect(existsSync).toHaveBeenCalledTimes(3);
    expect(joinSpy).toHaveBeenCalled();
    expect(dirnameSpy).toHaveBeenCalled();
  });

  it("falls back to <cwd>/data/shops when nothing found", async () => {
    const existsSync = jest.fn(() => false);
    jest.doMock("node:fs", () => ({ existsSync }));
    const actualPath = jest.requireActual("node:path");
    const resolveSpy = jest.fn(actualPath.resolve);
    jest.doMock("node:path", () => ({ ...actualPath, resolve: resolveSpy }));
    jest.spyOn(process, "cwd").mockReturnValue("/repo/app");

    const { resolveDataRoot } = await import("../src/dataRoot");
    existsSync.mockClear();
    resolveSpy.mockClear();

    expect(resolveDataRoot()).toBe(actualPath.resolve("/repo/app", "data", "shops"));
    expect(existsSync).toHaveBeenCalledTimes(3);
    expect(resolveSpy).toHaveBeenCalledWith("/repo/app", "data", "shops");
  });
});
