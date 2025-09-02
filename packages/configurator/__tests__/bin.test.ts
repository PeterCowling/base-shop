const err = new Error("boom");

describe("configurator bin", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("../dist/index.js");
    process.exitCode = undefined;
  });

  it("logs and sets exit code when dist import fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let p: Promise<unknown>;

    jest.doMock(
      "../dist/index.js",
      () => {
        throw err;
      },
      { virtual: true },
    );

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

  it("does not log or set exit code when dist import succeeds", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let p: Promise<unknown>;

    jest.doMock("../dist/index.js", () => ({}), { virtual: true });

    jest.isolateModules(() => {
      p = import("../bin/configurator.js");
    });

    await p;

    expect(errorSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();

    errorSpy.mockRestore();
  });
});
