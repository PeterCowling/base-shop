import { promises as fs } from "fs";
import { jsonInventoryRepository } from "../inventory.json.server";

// Mock stock alert service
const checkAndAlert = jest.fn();
jest.mock("../../services/stockAlert.server", () => ({ checkAndAlert }));

describe("json inventory repository", () => {
  afterEach(() => {
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
    expect(checkAndAlert).toHaveBeenCalledTimes(1);
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
    expect(checkAndAlert).not.toHaveBeenCalled();
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
    expect(checkAndAlert).toHaveBeenCalledTimes(1);
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
    expect(checkAndAlert).not.toHaveBeenCalled();
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
    expect(checkAndAlert).not.toHaveBeenCalled();
  });
});
