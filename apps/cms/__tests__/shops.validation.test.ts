import { mockShop,seedShop, withShop } from "@acme/test-utils";

afterEach(() => jest.resetAllMocks());

describe("updateShop validation", () => {
  it("returns validation errors", async () => {
    await withShop(async (dir) => {
      await seedShop(dir);
      mockShop();

      const { updateShop } = await import("../src/services/shops");

      const fd = new FormData();
      fd.append("id", "test");
      fd.append("name", "");
      fd.append("themeId", "");

      const result = await updateShop("test", fd);
      expect(result.errors?.name[0]).toBe("Required");
      expect(result.errors?.themeId[0]).toBe("Required");
    });
  });
});
