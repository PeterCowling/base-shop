import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const readJsonMock = jest.fn();
const writeJsonMock = jest.fn();

jest.mock("../storage", () => ({
  readJson: (...args: unknown[]) => readJsonMock(...args),
  writeJson: (...args: unknown[]) => writeJsonMock(...args),
}));

describe("inventoryStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("returns sold qty defaults and records sale increments", async () => {
    readJsonMock.mockReturnValueOnce({ p1: 2 });

    const { getSoldQty, recordSale } = await import("../inventoryStore");
    expect(getSoldQty("p1")).toBe(2);

    readJsonMock.mockReturnValueOnce({ p1: 2 });
    recordSale("p1", 3);

    expect(writeJsonMock).toHaveBeenCalledWith("XA_INVENTORY_SOLD_V1", { p1: 5 });
  });

  it("derives binary availability from product status", async () => {
    const { getAvailableStock } = await import("../inventoryStore");
    expect(getAvailableStock({ id: "sku-1", status: "live" } as any, {} as any)).toBe(1);
    expect(getAvailableStock({ id: "sku-1", status: "out_of_stock" } as any, {} as any)).toBe(0);
  });
});
