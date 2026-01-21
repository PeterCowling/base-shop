import { promises as fs } from "fs";

import { jsonInventoryRepository } from "../inventory.json.server";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  // eslint-disable-next-line no-var
  var __inventoryTestCheckAndAlert: jest.Mock | undefined;
}
globalThis.__inventoryTestCheckAndAlert = jest.fn();

// Mock stock alert service using globalThis
jest.mock("../../services/stockAlert.server", () => ({
  get checkAndAlert() {
    return globalThis.__inventoryTestCheckAndAlert;
  },
}));

describe("json inventory repository", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("retries acquiring lock on EEXIST", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    const open = jest
      .spyOn(fs, "open")
      .mockRejectedValueOnce(Object.assign(new Error("exists"), { code: "EEXIST" }))
      .mockResolvedValueOnce(handle);
    jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "1";
    await jsonInventoryRepository.write("shop", [
      { sku: "a", productId: "p", quantity: 1, variantAttributes: {} },
    ]);
    expect(open).toHaveBeenCalledTimes(2);
    expect(handle.close).toHaveBeenCalled();
  });

  it("logs and rethrows read errors", async () => {
    const err = new Error("fail");
    jest.spyOn(fs, "readFile").mockRejectedValue(err);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(jsonInventoryRepository.read("demo")).rejects.toBe(err);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Failed to read inventory for demo"), err);
  });

  it("loads legacy variant field correctly", async () => {
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify([
          {
            sku: "a",
            productId: "p",
            quantity: 1,
            variant: { size: "M" },
          },
        ]),
      );
    const items = await jsonInventoryRepository.read("shop");
    expect(items).toEqual([
      {
        sku: "a",
        productId: "p",
        quantity: 1,
        variantAttributes: { size: "M" },
      },
    ]);
  });

  it("serializes variantAttributes and triggers stock alert when enabled", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    jest.spyOn(fs, "open").mockResolvedValue(handle);
    const writeFile = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "0";
    await jsonInventoryRepository.write("shop", [
      {
        sku: "a",
        productId: "p1",
        quantity: 0,
        lowStockThreshold: 1,
        variantAttributes: {},
      },
      {
        sku: "b",
        productId: "p2",
        quantity: 0,
        lowStockThreshold: 1,
        variantAttributes: { color: "red" },
      },
    ]);

    const data = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(data).toEqual([
      { sku: "a", productId: "p1", quantity: 0, lowStockThreshold: 1 },
      {
        sku: "b",
        productId: "p2",
        quantity: 0,
        lowStockThreshold: 1,
        variantAttributes: { color: "red" },
      },
    ]);
    expect(globalThis.__inventoryTestCheckAndAlert).toHaveBeenCalledTimes(1);
  });

  it("skips stock alert when disabled", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    jest.spyOn(fs, "open").mockResolvedValue(handle);
    jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "1";
    await jsonInventoryRepository.write("shop", [
      {
        sku: "a",
        productId: "p1",
        quantity: 0,
        lowStockThreshold: 1,
        variantAttributes: {},
      },
    ]);
    expect(globalThis.__inventoryTestCheckAndAlert).not.toHaveBeenCalled();
  });

  it("creates item when file missing and alerts on low stock", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    jest.spyOn(fs, "open").mockResolvedValue(handle);
    jest
      .spyOn(fs, "readFile")
      .mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    const writeFile = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "0";
    const result = await jsonInventoryRepository.update(
      "shop",
      "s",
      { size: "L" },
      () => ({ productId: "p", quantity: 0, lowStockThreshold: 1 })
    );

    const data = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(data).toEqual([
      {
        sku: "s",
        productId: "p",
        quantity: 0,
        lowStockThreshold: 1,
        variantAttributes: { size: "L" },
      },
    ]);
    expect(result).toEqual({
      productId: "p",
      quantity: 0,
      lowStockThreshold: 1,
    });
    expect(globalThis.__inventoryTestCheckAndAlert).toHaveBeenCalledTimes(1);
  });

  it("updates existing item without variant attributes", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    jest.spyOn(fs, "open").mockResolvedValue(handle);
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify([
          { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
        ])
      );
    const writeFile = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "1";
    const result = await jsonInventoryRepository.update(
      "shop",
      "a",
      {},
      (current) => ({ ...current!, quantity: 2 })
    );

    const data = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(data).toEqual([
      { sku: "a", productId: "p1", quantity: 2 },
    ]);
    expect(result).toEqual({
      sku: "a",
      productId: "p1",
      quantity: 2,
      variantAttributes: {},
    });
    expect(globalThis.__inventoryTestCheckAndAlert).not.toHaveBeenCalled();
  });

  it("removes item when mutate returns undefined", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    jest.spyOn(fs, "open").mockResolvedValue(handle);
    jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        JSON.stringify([
          { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
        ])
      );
    const writeFile = jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    process.env.SKIP_STOCK_ALERT = "1";
    const result = await jsonInventoryRepository.update(
      "shop",
      "a",
      {},
      () => undefined
    );

    const data = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(data).toEqual([]);
    expect(result).toBeUndefined();
    expect(globalThis.__inventoryTestCheckAndAlert).not.toHaveBeenCalled();
  });

  it("cleans up stale lock files and proceeds", async () => {
    const handle = { close: jest.fn().mockResolvedValue(undefined) } as any;
    const open = jest
      .spyOn(fs, "open")
      .mockRejectedValueOnce(Object.assign(new Error("exists"), { code: "EEXIST" }))
      .mockResolvedValueOnce(handle);
    const stat = jest.spyOn(fs, "stat").mockResolvedValue({ mtimeMs: 0 } as any);
    const unlink = jest.spyOn(fs, "unlink").mockResolvedValue(undefined);
    jest.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    jest.spyOn(fs, "rename").mockResolvedValue(undefined);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    const now = jest.spyOn(Date, "now");
    now.mockReturnValueOnce(0); // start time
    now.mockReturnValueOnce(120000); // force timeout/stale check and mark stale
    now.mockReturnValue(120000);

    process.env.SKIP_STOCK_ALERT = "1";
    await jsonInventoryRepository.write("shop", [
      { sku: "a", productId: "p", quantity: 1, variantAttributes: {} },
    ]);

    expect(open).toHaveBeenCalledTimes(2);
    expect(stat).toHaveBeenCalled();
    expect(unlink).toHaveBeenCalled();
    now.mockRestore();
  });

  it("throws when lock cannot be acquired before timeout", async () => {
    jest.spyOn(fs, "open").mockRejectedValue(
      Object.assign(new Error("exists"), { code: "EEXIST" }),
    );
    jest.spyOn(fs, "stat").mockResolvedValue({ mtimeMs: Date.now() } as any);
    jest.spyOn(fs, "mkdir").mockResolvedValue(undefined);

    const now = jest.spyOn(Date, "now");
    now.mockReturnValueOnce(0);
    now.mockReturnValueOnce(6000);
    now.mockReturnValue(6000);

    process.env.SKIP_STOCK_ALERT = "1";
    await expect(
      jsonInventoryRepository.write("shop", [
        { sku: "a", productId: "p", quantity: 1, variantAttributes: {} },
      ]),
    ).rejects.toThrow("Timed out acquiring inventory lock");

    now.mockRestore();
  });
});
