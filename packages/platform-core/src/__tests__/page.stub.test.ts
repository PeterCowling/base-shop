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

  it("findMany supports multiple field filters", async () => {
    const page = createPageDelegate();
    await page.createMany({
      data: [
        { id: "1", type: "blog", shopId: "s1" },
        { id: "2", type: "blog", shopId: "s2" },
        { id: "3", type: "home", shopId: "s1" },
      ],
    });
    const result = await page.findMany({
      where: { type: "blog", shopId: "s1" },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "1", type: "blog", shopId: "s1" });
  });

  it("findMany returns all when where is undefined", async () => {
    const page = createPageDelegate();
    await page.createMany({ data: [{ id: "1" }, { id: "2" }] });
    const result = await page.findMany({ where: undefined });
    expect(result).toHaveLength(2);
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

  it("deleteMany returns zero count when nothing matches", async () => {
    const page = createPageDelegate();
    await page.createMany({
      data: [{ id: "1", shopId: "s1", type: "blog" }],
    });
    const result = await page.deleteMany({
      where: { shopId: "s2", type: "home" },
    });
    expect(result).toMatchObject({ count: 0 });
    const remaining = await page.findMany();
    expect(remaining).toHaveLength(1);
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

  it("upsert creates record when missing without error", async () => {
    const page = createPageDelegate();
    await expect(
      page.upsert({
        where: { id: "1" },
        update: { title: "Updated" },
        create: { id: "1", title: "New" },
      }),
    ).resolves.toMatchObject({ id: "1", title: "New" });
  });
});

