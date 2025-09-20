import { withShop, seedShop, mockShop } from "@acme/test-utils";

afterEach(() => jest.resetAllMocks());

describe("updateShop errors", () => {
  it("throws when ids do not match", async () => {
    await withShop(async (dir) => {
      await seedShop(dir);
      mockShop();

      const { updateShop } = await import("../src/services/shops");

      const fd = new FormData();
      fd.append("id", "wrong");
      fd.append("name", "Updated");
      fd.append("themeId", "base");

      await expect(updateShop("test", fd)).rejects.toThrow(
        "Shop wrong not found in test",
      );
    });
  });
});
