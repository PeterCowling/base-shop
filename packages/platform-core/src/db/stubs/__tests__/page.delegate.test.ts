/** @jest-environment node */
import { createPageDelegate } from "../page";

describe("page delegate", () => {
  it("creates, finds, updates and upserts pages", async () => {
    const d = createPageDelegate();
    await d.createMany({
      data: [
        { id: "1", shopId: "s1", title: "a" },
        { id: "2", shopId: "s2", title: "b" },
      ],
    });
    expect(await d.findMany({ where: { shopId: "s1" } })).toEqual([
      { id: "1", shopId: "s1", title: "a" },
    ]);
    expect(await d.findMany({ where: { shopId: "none" } })).toEqual([]);
    const upd = await d.update({ where: { id: "1" }, data: { title: "A" } });
    expect(upd.title).toBe("A");
    const upsertExisting = await d.upsert({
      where: { id: "1" },
      update: { title: "AA" },
      create: { id: "1", shopId: "s1", title: "AA" },
    });
    expect(upsertExisting.title).toBe("AA");
    await d.upsert({
      where: { id: "3" },
      update: { title: "c" },
      create: { id: "3", shopId: "s1", title: "c" },
    });
    expect((await d.findMany()).length).toBe(3);
  });

  it("throws when updating a missing page", async () => {
    const d = createPageDelegate();
    await expect(
      d.update({ where: { id: "missing" }, data: { title: "noop" } })
    ).rejects.toThrow("Page not found");
  });

  it("deleteMany removes matching pages", async () => {
    const d = createPageDelegate();
    await d.createMany({
      data: [
        { id: "1", shopId: "s1" },
        { id: "2", shopId: "s1" },
        { id: "3", shopId: "s2" },
      ],
    });
    const result = await d.deleteMany({ where: { shopId: "s1" } });
    expect(result.count).toBe(2);
    expect(await d.findMany()).toHaveLength(1);
  });
});

