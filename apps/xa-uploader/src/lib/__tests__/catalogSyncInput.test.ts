import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const accessMock = jest.fn();
const readCsvFileMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: (...args: unknown[]) => accessMock(...args),
  },
}));

jest.mock("@acme/lib/xa", () => ({
  readCsvFile: (...args: unknown[]) => readCsvFileMock(...args),
}));

describe("catalogSyncInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns missing status when CSV file does not exist", async () => {
    const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
    accessMock.mockRejectedValueOnce(missing);

    const { getCatalogSyncInputStatus } = await import("../catalogSyncInput");
    const result = await getCatalogSyncInputStatus("/tmp/products.csv");

    expect(result).toEqual({ exists: false, rowCount: 0 });
    expect(readCsvFileMock).not.toHaveBeenCalled();
  });

  it("returns row count when CSV exists", async () => {
    accessMock.mockResolvedValueOnce(undefined);
    readCsvFileMock.mockResolvedValueOnce({
      rows: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      columns: ["id"],
    });

    const { getCatalogSyncInputStatus } = await import("../catalogSyncInput");
    const result = await getCatalogSyncInputStatus("/tmp/products.csv");

    expect(result).toEqual({ exists: true, rowCount: 3 });
    expect(readCsvFileMock).toHaveBeenCalledWith("/tmp/products.csv");
  });

  it("rethrows non-ENOENT filesystem errors", async () => {
    accessMock.mockRejectedValueOnce(new Error("EACCES"));

    const { getCatalogSyncInputStatus } = await import("../catalogSyncInput");
    await expect(getCatalogSyncInputStatus("/tmp/products.csv")).rejects.toThrow("EACCES");
  });
});
