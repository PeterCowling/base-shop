import fs from "fs";

jest.mock("fs");
jest.mock("child_process", () => ({
  spawnSync: jest.fn(() => ({ status: 0 })),
}));

let deployShop: (id: string, domain?: string) => any;
beforeAll(async () => {
  ({ deployShop } = await import("../src/createShop"));
});

const fsMock = fs as jest.Mocked<typeof fs>;

describe("deployShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("writes deploy.json and returns preview url", () => {
    const result = deployShop("shopx", "shop.example.com");
    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("data/shops/shopx/deploy.json"),
      expect.any(String)
    );
    expect(result.previewUrl).toContain("shopx");
    expect(result.instructions).toContain("CNAME");
    expect(result.domain).toEqual({
      name: "shop.example.com",
      status: "pending",
    });
  });
});
