/** @jest-environment node */

const readFileMock = jest.fn();
const generateMetaMock = jest.fn();

jest.mock("node:fs", () => ({
  promises: { readFile: (...args: unknown[]) => readFileMock(...args) },
}));
jest.mock("@acme/lib/generateMeta", () => ({
  generateMeta: (...args: unknown[]) => generateMetaMock(...args),
}));

describe("generate-meta script", () => {
  const originalArgv = process.argv.slice();

  beforeEach(() => {
    jest.resetModules();
    readFileMock.mockReset();
    generateMetaMock.mockReset();
    process.argv = originalArgv.slice();
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it("outputs meta for provided product file", async () => {
    process.argv[2] = "product.json";
    const result = { title: "Test" };
    readFileMock.mockResolvedValue("{\"name\":\"test\"}");
    generateMetaMock.mockResolvedValue(result);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { runGenerateMetaCli } = await import("../generate-meta.ts");
    await runGenerateMetaCli();
    expect(readFileMock).toHaveBeenCalledWith("product.json", "utf8");
    expect(generateMetaMock).toHaveBeenCalledWith({ name: "test" });
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(result, null, 2));
    logSpy.mockRestore();
  });

  it("exits when input path missing", async () => {
    const scriptPath = require("path").resolve(__dirname, "..", "generate-meta.ts");
    process.argv[1] = scriptPath;
    delete process.argv[2];
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    readFileMock.mockResolvedValue("{}");
    generateMetaMock.mockResolvedValue({});
    const { runGenerateMetaCli } = await import("../generate-meta.ts");
    await runGenerateMetaCli();
    expect(errorSpy).toHaveBeenCalledWith("Usage: generate-meta.ts ");
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
