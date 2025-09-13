import { createPageDelegate } from "../src/db/stubs/page";

describe("createPageDelegate", () => {
  it("throws when updating a missing page", async () => {
    const delegate = createPageDelegate();
    await expect(
      delegate.update({ where: { id: "missing" }, data: { title: "noop" } })
    ).rejects.toThrow("Page not found");
  });

  it("deleteMany removes matching pages", async () => {
    const delegate = createPageDelegate();
    await delegate.createMany({
      data: [
        { id: "1", shopId: "s1" },
        { id: "2", shopId: "s1" },
        { id: "3", shopId: "s2" },
      ],
    });
    const result = await delegate.deleteMany({ where: { shopId: "s1" } });
    expect(result.count).toBe(2);
    const remaining = await delegate.findMany();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ id: "3" });
  });

  it("upsert updates existing and inserts new records", async () => {
    const delegate = createPageDelegate();
    await delegate.createMany({ data: [{ id: "1", title: "Old" }] });
    const updated = await delegate.upsert({
      where: { id: "1" },
      update: { title: "New" },
      create: { id: "1", title: "Should not" },
    });
    expect(updated).toMatchObject({ id: "1", title: "New" });
    const created = await delegate.upsert({
      where: { id: "2" },
      update: { title: "Updated" },
      create: { id: "2", title: "Brand" },
    });
    expect(created).toMatchObject({ id: "2", title: "Brand" });
    const all = await delegate.findMany();
    expect(all).toHaveLength(2);
  });
});
