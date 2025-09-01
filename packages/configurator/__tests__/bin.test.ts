const err = new Error("boom");

jest.mock("../dist/index.js", () => {
  throw err;
}, { virtual: true });

describe("configurator bin", () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it("logs and sets exit code when dist import fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let p: Promise<unknown>;

    jest.isolateModules(() => {
      p = import("../bin/configurator.js");
    });

    await p.catch(() => {});

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load the compiled configurator module:",
      expect.anything(),
    );
    expect(process.exitCode).toBe(1);

    errorSpy.mockRestore();
  });
});
