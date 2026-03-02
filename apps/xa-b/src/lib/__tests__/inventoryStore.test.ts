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

  it("computes available stock from stock-sold-reserved", async () => {
    readJsonMock.mockReturnValue({ "sku-1": 2 });

    const { getAvailableStock } = await import("../inventoryStore");
    const available = getAvailableStock(
      { id: "sku-1", stock: 10 } as any,
      {
        line1: { sku: { id: "sku-1" }, qty: 3 },
        line2: { sku: { id: "sku-2" }, qty: 2 },
      } as any,
    );

    expect(available).toBe(5);
  });
});
