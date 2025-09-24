/** @jest-environment node */
import { createProductDelegate } from "../product";

describe("product delegate", () => {
  it("manages product records", async () => {
    const d = createProductDelegate();
    await d.createMany({
      data: [
        { id: "p1", shopId: "s1", name: "a" },
        { id: "p2", shopId: "s1", name: "b" },
        { id: "p3", shopId: "s2", name: "c" },
      ],
    });
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(2);
    expect(
      await d.findUnique({ where: { shopId_id: { shopId: "s1", id: "p1" } } })
    ).toHaveProperty("name", "a");
    expect(
      await d.findUnique({ where: { shopId_id: { shopId: "s9", id: "p1" } } })
    ).toBeNull();
    expect(await d.findUnique({ where: { id: "p1" } })).toBeNull();
    const updated = await d.update({
      where: { shopId_id: { shopId: "s1", id: "p1" } },
      data: { name: "aa" },
    });
    expect(updated.name).toBe("aa");
    await expect(
      d.update({
        where: { shopId_id: { shopId: "s9", id: "p9" } },
        data: { name: "x" },
      })
    ).rejects.toThrow("Product not found");
    await d.create({ data: { id: "p4", shopId: "s1", name: "d" } });
    const removed = await d.delete({
      where: { shopId_id: { shopId: "s1", id: "p2" } },
    });
    expect(removed.id).toBe("p2");
    await expect(
      d.delete({ where: { shopId_id: { shopId: "s1", id: "p2" } } })
    ).rejects.toThrow("Product not found");
    const delMany = await d.deleteMany({ where: { shopId: "s1" } });
    expect(delMany.count).toBe(2);
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(0);
    await d.create({ data: { id: "p5", shopId: "s3", name: "e" } });
    const delShop3 = await d.deleteMany({ where: { shopId: "s3" } });
    expect(delShop3.count).toBe(1);
    expect(await d.findMany({ where: { shopId: "s3" } })).toHaveLength(0);
  });
});

