jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../repoResolver";

describe("shops repository wrapper", () => {
  const read = jest.fn();
  const write = jest.fn();
  const apply = jest.fn();

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue({
      readShop: read,
      writeShop: write,
      applyThemeData: apply,
    });
  });

  it("delegates readShop", async () => {
    const { readShop } = await import("../shops.server");
    await readShop("shop1");
    expect(read).toHaveBeenCalledWith("shop1");
  });

  it("delegates writeShop", async () => {
    const { writeShop } = await import("../shops.server");
    await writeShop("shop1", { id: "shop1" });
    expect(write).toHaveBeenCalledWith("shop1", { id: "shop1" });
  });

  it("delegates applyThemeData", async () => {
    const { applyThemeData } = await import("../shops.server");
    const data = { id: "shop1" } as any;
    await applyThemeData(data);
    expect(apply).toHaveBeenCalledWith(data);
  });
});
