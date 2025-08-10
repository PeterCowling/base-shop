// scripts/__tests__/check-locales.test.ts

const execSync = jest.fn();
const readFileSync = jest.fn();

jest.mock("node:child_process", () => ({ execSync }));
jest.mock("node:fs", () => ({ readFileSync }));

describe("check-locales script", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("reports violations when locale arrays are hard-coded", async () => {
    execSync.mockReturnValue("a.ts\nb.ts");
    readFileSync.mockImplementation((file: string) =>
      file === "a.ts" ? "['en', 'de', 'it']" : "const x = 1;"
    );

    const exitMock = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);
    const errorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(import("../src/check-locales")).rejects.toThrow("exit:1");

    expect(errorMock).toHaveBeenCalledWith(
      "Hard-coded locale array detected. Authoritative list is LOCALES."
    );
    expect(errorMock).toHaveBeenCalledWith(" -", "a.ts");
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("passes when no hard-coded locale arrays exist", async () => {
    execSync.mockReturnValue("a.ts\nb.ts");
    readFileSync.mockReturnValue("const locales = LOCALES;");

    const exitMock = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);
    const logMock = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await import("../src/check-locales");

    expect(logMock).toHaveBeenCalledWith(
      "No hard-coded locale arrays found."
    );
    expect(exitMock).not.toHaveBeenCalled();
  });
});

