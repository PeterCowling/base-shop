/** @jest-environment node */

import path from "path";

import { getDeployStatus, updateDeployStatus } from "../deployShop.server";

const ensureAuthorizedMock = jest.fn();
const readFileMock = jest.fn();
const withFileLockMock = jest.fn();
const writeJsonFileMock = jest.fn();
const updateShopInRepoMock = jest.fn();

jest.mock("../common/auth", () => ({ ensureAuthorized: () => ensureAuthorizedMock() }));
jest.mock("@/lib/server/jsonIO", () => ({
  writeJsonFile: (...args: any[]) => writeJsonFileMock(...args),
  withFileLock: (...args: any[]) => withFileLockMock(...args),
}));
jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/data",
}));
jest.mock("fs/promises", () => ({
  readFile: (...args: any[]) => readFileMock(...args),
}));
jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  updateShopInRepo: (...args: any[]) => updateShopInRepoMock(...args),
}));

describe("getDeployStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ status: "active" }));

    const result = await getDeployStatus("shop1");

    expect(result).toEqual({ status: "active" });
    expect(readFileMock).toHaveBeenCalledWith(
      path.join("/data", "shop1", "deploy.json"),
      "utf8"
    );
    expect(ensureAuthorizedMock).toHaveBeenCalled();
  });

  it("returns pending with error on read failure while logging", async () => {
    const err = new Error("fail");
    readFileMock.mockRejectedValueOnce(err);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await getDeployStatus("shop1");

    expect(result).toEqual({ status: "pending", error: "fail" });
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to read deploy status",
      err
    );
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("updateDeployStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs errors when withFileLock throws", async () => {
    const err = new Error("lock fail");
    withFileLockMock.mockRejectedValueOnce(err);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await updateDeployStatus("shop1", {});

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to write deploy status",
      err
    );
    expect(withFileLockMock).toHaveBeenCalled();
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("updates shop domain when provided", async () => {
    withFileLockMock.mockImplementation(async (_file, cb) => {
      await cb();
    });
    readFileMock.mockResolvedValueOnce("{}");
    writeJsonFileMock.mockResolvedValue(undefined);
    updateShopInRepoMock.mockResolvedValue(undefined);

    await updateDeployStatus("shop1", {
      status: "new",
      domain: "shop.example.com",
      domainStatus: "active",
      certificateStatus: "valid",
    });

    expect(updateShopInRepoMock).toHaveBeenCalledWith("shop1", {
      id: "shop1",
      domain: {
        name: "shop.example.com",
        status: "active",
        certificateStatus: "valid",
      },
    });
    expect(ensureAuthorizedMock).toHaveBeenCalled();
  });

  it("handles errors when updating shop domain fails", async () => {
    withFileLockMock.mockImplementation(async (_file, cb) => {
      await cb();
    });
    readFileMock.mockResolvedValueOnce("{}");
    writeJsonFileMock.mockResolvedValue(undefined);
    const err = new Error("update fail");
    updateShopInRepoMock.mockRejectedValueOnce(err);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await updateDeployStatus("shop1", {
      domain: "shop.example.com",
      domainStatus: "active",
      certificateStatus: "valid",
    });

    expect(updateShopInRepoMock).toHaveBeenCalledWith("shop1", {
      id: "shop1",
      domain: {
        name: "shop.example.com",
        status: "active",
        certificateStatus: "valid",
      },
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to update shop domain",
      err
    );
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

