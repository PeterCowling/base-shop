/** @jest-environment node */

import path from "path";

const ensureAuthorizedMock = jest.fn();
const deployShopMock = jest.fn();
const readFileMock = jest.fn();
const withFileLockMock = jest.fn();
const writeJsonFileMock = jest.fn();
const updateShopInRepoMock = jest.fn();

jest.mock("../common/auth", () => ({ ensureAuthorized: () => ensureAuthorizedMock() }));
jest.mock("@platform-core/createShop", () => ({
  deployShop: (...args: any[]) => deployShopMock(...args),
}));
jest.mock("@/lib/server/jsonIO", () => ({
  writeJsonFile: (...args: any[]) => writeJsonFileMock(...args),
  withFileLock: (...args: any[]) => withFileLockMock(...args),
}));
jest.mock("@platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/data",
}));
jest.mock("fs/promises", () => ({
  readFile: (...args: any[]) => readFileMock(...args),
}));
jest.mock("@platform-core/repositories/shop.server", () => ({
  updateShopInRepo: (...args: any[]) => updateShopInRepoMock(...args),
}));

import {
  deployShopHosting,
  getDeployStatus,
  updateDeployStatus,
} from "../deployShop.server";

describe("deployShopHosting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls ensureAuthorized and deployShop", async () => {
    deployShopMock.mockResolvedValueOnce({ status: "ok" });

    const result = await deployShopHosting("shop1", "example.com");

    expect(result).toEqual({ status: "ok" });
    expect(ensureAuthorizedMock).toHaveBeenCalled();
    expect(deployShopMock).toHaveBeenCalledWith("shop1", "example.com");
  });
});

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

  it("merges existing data when domain is not provided", async () => {
    withFileLockMock.mockImplementation(async (_file, cb) => {
      await cb();
    });
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ existing: "prop" })
    );
    writeJsonFileMock.mockResolvedValue(undefined);

    await updateDeployStatus("shop1", { status: "active" });

    expect(writeJsonFileMock).toHaveBeenCalledWith(
      path.join("/data", "shop1", "deploy.json"),
      { existing: "prop", status: "active" }
    );
    expect(updateShopInRepoMock).not.toHaveBeenCalled();
    expect(ensureAuthorizedMock).toHaveBeenCalled();
  });

  it("merges existing data and updates shop when domain is provided", async () => {
    withFileLockMock.mockImplementation(async (_file, cb) => {
      await cb();
    });
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ existing: "prop", status: "old" })
    );
    writeJsonFileMock.mockResolvedValue(undefined);
    updateShopInRepoMock.mockResolvedValue(undefined);

    await updateDeployStatus("shop1", {
      status: "new",
      domain: "shop.example.com",
      domainStatus: "active",
      certificateStatus: "valid",
    });

    expect(writeJsonFileMock).toHaveBeenCalledWith(
      path.join("/data", "shop1", "deploy.json"),
      {
        existing: "prop",
        status: "new",
        domain: "shop.example.com",
        domainStatus: "active",
        certificateStatus: "valid",
      }
    );
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

  it("invokes updateShopInRepo when domain provided and handles rejection", async () => {
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

