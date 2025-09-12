/** @jest-environment node */

import { createProductDelegate } from "../db/stubs";

describe("createProductDelegate", () => {
  it("handles findMany, createMany and deleteMany", async () => {
    const product = createProductDelegate();
    await product.createMany({
      data: [
        { shopId: "s1", id: "p1" },
        { shopId: "s1", id: "p2" },
        { shopId: "s2", id: "p3" },
      ],
    });

    await expect(product.findMany({ where: { shopId: "s1" } })).resolves.toHaveLength(2);

    await expect(product.deleteMany({ where: { shopId: "s1" } })).resolves.toEqual({ count: 2 });

    await expect(product.findMany({ where: { shopId: "s1" } })).resolves.toHaveLength(0);
    await expect(product.findMany({ where: { shopId: "s2" } })).resolves.toHaveLength(1);
  });

  it("finds unique products via shopId_id", async () => {
    const product = createProductDelegate();
    await product.createMany({ data: [{ shopId: "s1", id: "p1", title: "t" }] });

    await expect(
      product.findUnique({ where: { shopId_id: { shopId: "s1", id: "p1" } } }),
    ).resolves.toMatchObject({ shopId: "s1", id: "p1", title: "t" });

    await expect(
      product.findUnique({ where: { shopId_id: { shopId: "s1", id: "missing" } } }),
    ).resolves.toBeNull();
  });

  describe("update", () => {
    it("updates existing records", async () => {
      const product = createProductDelegate();
      await product.create({ data: { shopId: "s1", id: "p1", title: "a" } });

      await expect(
        product.update({
          where: { shopId_id: { shopId: "s1", id: "p1" } },
          data: { title: "b" },
        }),
      ).resolves.toMatchObject({ title: "b" });
    });

    it("throws for missing records", async () => {
      const product = createProductDelegate();
      await expect(
        product.update({
          where: { shopId_id: { shopId: "s1", id: "p1" } },
          data: { title: "b" },
        }),
      ).rejects.toThrow("Product not found");
    });
  });

  describe("delete", () => {
    it("removes existing records", async () => {
      const product = createProductDelegate();
      await product.create({ data: { shopId: "s1", id: "p1" } });

      await expect(
        product.delete({ where: { shopId_id: { shopId: "s1", id: "p1" } } }),
      ).resolves.toMatchObject({ id: "p1" });

      await expect(
        product.findUnique({ where: { shopId_id: { shopId: "s1", id: "p1" } } }),
      ).resolves.toBeNull();
    });

    it("throws for missing records", async () => {
      const product = createProductDelegate();
      await expect(
        product.delete({ where: { shopId_id: { shopId: "s1", id: "p1" } } }),
      ).rejects.toThrow("Product not found");
    });
  });
});

