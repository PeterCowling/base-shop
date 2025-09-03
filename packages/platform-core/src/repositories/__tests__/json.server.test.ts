import type { Shop } from "@acme/types";

describe("json.readShop", () => {
  it("lazy-loads shops.server and forwards the result", async () => {
    await jest.isolateModulesAsync(async () => {
      const fake: Shop = { id: "s1" } as Shop;
      const readMock = jest.fn(async () => fake);
      let loaded = false;
      jest.doMock("../shops.server", () => {
        loaded = true;
        return { readShop: readMock };
      });
      const { readShop } = await import("../json.server");
      expect(loaded).toBe(false);
      const result = await readShop("s1");
      expect(loaded).toBe(true);
      expect(readMock).toHaveBeenCalledWith("s1");
      expect(result).toBe(fake);
    });
  });
});
