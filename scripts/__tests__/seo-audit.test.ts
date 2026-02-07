/** @jest-environment node */

const runSeoAuditMock = jest.fn();

jest.mock("@acme/lib/seoAudit", () => ({
  runSeoAudit: (...args: unknown[]) => runSeoAuditMock(...args),
}));

describe("seo-audit script", () => {
  const originalArgv = process.argv.slice();

  beforeEach(() => {
    jest.resetModules();
    runSeoAuditMock.mockReset();
    process.argv = originalArgv.slice();
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it("runs audit for provided url", async () => {
    const scriptPath = require("path").resolve(__dirname, "..", "seo-audit.ts");
    process.argv[1] = scriptPath;
    process.argv[2] = "https://example.com";
    const result = { ok: true };
    runSeoAuditMock.mockResolvedValue(result);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await import("../seo-audit.ts");
    await Promise.resolve();
    expect(runSeoAuditMock).toHaveBeenCalledWith("https://example.com");
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(result));
    logSpy.mockRestore();
  });

  it("exits on audit error", async () => {
    const scriptPath = require("path").resolve(__dirname, "..", "seo-audit.ts");
    process.argv[1] = scriptPath;
    runSeoAuditMock.mockRejectedValue(new Error("fail"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as any);
    await import("../seo-audit.ts");
    await new Promise((resolve) => setImmediate(resolve));
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
