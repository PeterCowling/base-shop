/** @jest-environment node */

const run = jest.fn((argv = process.argv) => undefined);
jest.mock("../cli", () => ({ run }));

describe("bin", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("calls run with process.argv", () => {
    const argv = ["node", "email", "test"];
    process.argv = argv;

    jest.isolateModules(() => {
      require("../bin");
    });

    expect(run).toHaveBeenCalledWith(argv);
  });
});
