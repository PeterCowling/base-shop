/** @jest-environment node */

const readFileMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));
jest.mock("cross-fetch", () => (
  (...args: unknown[]) => fetchMock(...args)
));

describe("migrate-cms script", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    readFileMock.mockReset();
    fetchMock.mockReset();
    process.env = {
      ...originalEnv,
      CMS_SPACE_URL: "https://cms.example",
      CMS_ACCESS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("pushes page and shop schemas", async () => {
    readFileMock.mockResolvedValueOnce("{}" ).mockResolvedValueOnce("{}" );
    fetchMock.mockResolvedValue({ ok: true });
    await import("../migrate-cms.ts");
    await new Promise(setImmediate);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example/schemas/page",
      expect.objectContaining({ method: "PUT" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example/schemas/shop",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("logs error when fetch fails", async () => {
    readFileMock.mockResolvedValue("{}" );
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "bad" })
      .mockResolvedValue({ ok: true });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await import("../migrate-cms.ts");
    await new Promise(setImmediate);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to push page:"),
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("exits on invalid environment", async () => {
    process.env = {}; // missing required vars
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit ${code}`);
      }) as any);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../migrate-cms.ts")).rejects.toThrow("exit 1");
    expect(errorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:\n",
      expect.anything()
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
