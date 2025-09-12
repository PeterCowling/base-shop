/** @jest-environment node */

import { createPageDelegate } from "../db/stubs";

describe("createPageDelegate page operations", () => {
  it("createMany adds pages", async () => {
    const page = createPageDelegate();
    const result = await page.createMany({
      data: [
        { id: "1", shopId: "s1" },
        { id: "2", shopId: "s2" },
      ],
    });
    expect(result.count).toBe(2);
    const all = await page.findMany();
    expect(all).toHaveLength(2);
  });

  it("findMany filters pages", async () => {
    const page = createPageDelegate();
    await page.createMany({
      data: [
        { id: "1", type: "blog" },
        { id: "2", type: "home" },
      ],
    });
    const all = await page.findMany();
    expect(all).toHaveLength(2);
    const blogPages = await page.findMany({ where: { type: "blog" } });
    expect(blogPages).toHaveLength(1);
    expect(blogPages[0]).toMatchObject({ id: "1", type: "blog" });
  });

  it("update modifies existing page", async () => {
    const page = createPageDelegate();
    await page.createMany({ data: [{ id: "1", title: "Old" }] });
    const updated = await page.update({
      where: { id: "1" },
      data: { title: "New" },
    });
    expect(updated).toMatchObject({ id: "1", title: "New" });
  });

  it("update throws when page is missing", async () => {
    const page = createPageDelegate();
    await expect(
      page.update({ where: { id: "missing" }, data: { title: "noop" } }),
    ).rejects.toThrow("Page not found");
  });

  it("deleteMany removes matching pages", async () => {
    const page = createPageDelegate();
    await page.createMany({
      data: [
        { id: "1", shopId: "s1" },
        { id: "2", shopId: "s1" },
        { id: "3", shopId: "s2" },
      ],
    });
    const result = await page.deleteMany({ where: { shopId: "s1" } });
    expect(result.count).toBe(2);
    const remaining = await page.findMany();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ id: "3" });
  });

  it("upsert updates existing and inserts new records", async () => {
    const page = createPageDelegate();
    await page.createMany({ data: [{ id: "1", title: "Old" }] });
    const updated = await page.upsert({
      where: { id: "1" },
      update: { title: "New" },
      create: { id: "1", title: "Should not" },
    });
    expect(updated).toMatchObject({ id: "1", title: "New" });

    const created = await page.upsert({
      where: { id: "2" },
      update: { title: "Updated" },
      create: { id: "2", title: "Brand" },
    });
    expect(created).toMatchObject({ id: "2", title: "Brand" });

    const all = await page.findMany();
    expect(all).toHaveLength(2);
  });
});

