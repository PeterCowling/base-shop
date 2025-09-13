import { createProductDelegate } from "../src/db/stubs/product";

describe("createProductDelegate", () => {
  it("returns null when findUnique is called without shopId_id", async () => {
    const delegate = createProductDelegate();
    await delegate.create({ data: { shopId: "s1", id: "p1" } });
    const result = await delegate.findUnique({ where: { id: "p1" } });
    expect(result).toBeNull();
  });

  it("throws when updating or deleting a missing product", async () => {
    const delegate = createProductDelegate();
    await expect(
      delegate.update({
        where: { shopId_id: { shopId: "s1", id: "missing" } },
        data: { name: "test" },
      })
    ).rejects.toThrow("Product not found");
    await expect(
      delegate.delete({ where: { shopId_id: { shopId: "s1", id: "missing" } } })
    ).rejects.toThrow("Product not found");
  });

  it("adds with createMany and removes with deleteMany", async () => {
    const delegate = createProductDelegate();
    const data = [
      { shopId: "s1", id: "p1" },
      { shopId: "s1", id: "p2" },
      { shopId: "s2", id: "p3" },
    ];
    const created = await delegate.createMany({ data });
    expect(created).toEqual({ count: 3 });
    expect(await delegate.findMany({ where: { shopId: "s1" } })).toHaveLength(2);

    const removed = await delegate.deleteMany({ where: { shopId: "s1" } });
    expect(removed).toEqual({ count: 2 });
    expect(await delegate.findMany({ where: { shopId: "s1" } })).toEqual([]);
    expect(await delegate.findMany({ where: { shopId: "s2" } })).toHaveLength(1);
  });
});

