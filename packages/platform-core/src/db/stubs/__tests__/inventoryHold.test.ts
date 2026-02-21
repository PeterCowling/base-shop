/** @jest-environment node */
import { createInventoryHoldDelegate } from "../inventoryHold";

describe("inventoryHold delegate", () => {
  it("creates and retrieves a hold by id", async () => {
    const d = createInventoryHoldDelegate();
    const hold = {
      id: "h1",
      shopId: "s1",
      status: "active" as const,
      expiresAt: new Date("2026-01-01"),
    };
    await d.create({ data: hold });
    const found = await d.findUnique({ where: { id: "h1" } });
    expect(found).toMatchObject({ id: "h1", shopId: "s1", status: "active" });
  });

  it("retrieves by composite key", async () => {
    const d = createInventoryHoldDelegate();
    await d.create({
      data: { id: "h1", shopId: "s1", status: "active" as const, expiresAt: new Date() },
    });
    const found = await d.findUnique({
      where: { shopId_holdId: { shopId: "s1", holdId: "h1" } },
    });
    expect(found).toMatchObject({ id: "h1" });
    const notFound = await d.findUnique({
      where: { shopId_holdId: { shopId: "other", holdId: "h1" } },
    });
    expect(notFound).toBeNull();
  });

  it("prevents duplicate creates", async () => {
    const d = createInventoryHoldDelegate();
    const hold = { id: "h1", shopId: "s1", status: "active" as const, expiresAt: new Date() };
    await d.create({ data: hold });
    await expect(d.create({ data: hold })).rejects.toThrow("already exists");
  });

  it("filters by status and shopId", async () => {
    const d = createInventoryHoldDelegate();
    await d.create({
      data: { id: "h1", shopId: "s1", status: "active" as const, expiresAt: new Date() },
    });
    await d.create({
      data: { id: "h2", shopId: "s1", status: "committed" as const, expiresAt: new Date() },
    });
    await d.create({
      data: { id: "h3", shopId: "s2", status: "active" as const, expiresAt: new Date() },
    });
    const active = await d.findMany({ where: { shopId: "s1", status: "active" as const } });
    expect(active).toHaveLength(1);
  });

  it("updateMany changes matching hold", async () => {
    const d = createInventoryHoldDelegate();
    await d.create({
      data: { id: "h1", shopId: "s1", status: "active" as const, expiresAt: new Date() },
    });
    const result = await d.updateMany({
      where: { id: "h1", shopId: "s1", status: "active" as const },
      data: { status: "committed" as const, committedAt: new Date() },
    });
    expect(result.count).toBe(1);
    const updated = await d.findUnique({ where: { id: "h1" } });
    expect(updated?.status).toBe("committed");
  });

  it("updateMany returns 0 for non-matching status", async () => {
    const d = createInventoryHoldDelegate();
    await d.create({
      data: { id: "h1", shopId: "s1", status: "active" as const, expiresAt: new Date() },
    });
    const result = await d.updateMany({
      where: { id: "h1", shopId: "s1", status: "committed" as const },
      data: { releasedAt: new Date() },
    });
    expect(result.count).toBe(0);
  });
});
