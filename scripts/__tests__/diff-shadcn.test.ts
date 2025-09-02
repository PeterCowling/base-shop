/** @jest-environment node */

const spawnMock = jest.fn();
const existsMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawnSync: (...args: unknown[]) => spawnMock(...args),
}));
jest.mock("node:fs", () => ({
  existsSync: (...args: unknown[]) => existsMock(...args),
}));

describe("diff-shadcn script", () => {
  beforeEach(() => {
    jest.resetModules();
    spawnMock.mockReset();
    existsMock.mockReset();
  });

  it("spawns diff for existing upstream component", async () => {
    existsMock.mockImplementation((p: unknown) =>
      typeof p === "string" && p.includes("button.tsx")
    );
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await import("../diff-shadcn.ts");
    expect(spawnMock).toHaveBeenCalledWith(
      "diff",
      expect.arrayContaining([
        "-u",
        expect.stringContaining("button.tsx"),
        expect.stringContaining("button.tsx"),
      ]),
      { stdio: "inherit" }
    );
    logSpy.mockRestore();
  });

  it("logs error when upstream component missing", async () => {
    existsMock.mockReturnValue(false);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await import("../diff-shadcn.ts");
    expect(spawnMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing upstream component")
    );
    errorSpy.mockRestore();
  });
});
