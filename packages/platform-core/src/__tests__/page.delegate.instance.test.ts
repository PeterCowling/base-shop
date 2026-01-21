/** @jest-environment node */
import { createPageDelegate,pageDelegate } from "../db/stubs/page";

describe("page delegate default instance", () => {
  it("update throws when page is missing", async () => {
    await expect(
      pageDelegate.update({ where: { id: "missing" }, data: { title: "noop" } }),
    ).rejects.toThrow("Page not found");
  });

  it("deleteMany returns correct count", async () => {
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
  });
});
