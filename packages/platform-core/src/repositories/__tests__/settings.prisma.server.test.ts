import { jest } from "@jest/globals";

import type { Settings } from "../settings.json.server";

const prismaMock = {
  setting: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  settingDiff: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("../../db", () => ({ prisma: prismaMock }));

const jsonMock = {
  getShopSettings: jest.fn(),
  saveShopSettings: jest.fn(),
  diffHistory: jest.fn(),
};

jest.mock("../settings.json.server", () => ({
  jsonSettingsRepository: jsonMock,
}));

describe("settings.prisma.server", () => {
  const shop = "demo";
  let repo: typeof import("../settings.prisma.server");

  const base: Settings = {
    languages: ["en"],
    seo: {},
    updatedAt: "",
    updatedBy: "",
  } as Settings;

  beforeAll(async () => {
    repo = await import("../settings.prisma.server");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads settings from prisma", async () => {
    prismaMock.setting.findUnique.mockResolvedValue({ shop, data: base });
    const res = await repo.getShopSettings(shop);
    expect(res).toMatchObject(base);
    expect(prismaMock.setting.findUnique).toHaveBeenCalledWith({ where: { shop } });
    expect(jsonMock.getShopSettings).not.toHaveBeenCalled();
  });

  it("saves settings via prisma and records diff", async () => {
    prismaMock.setting.findUnique.mockResolvedValue({ shop, data: base });
    const updated: Settings = { ...base, currency: "USD" } as Settings;
    await repo.saveShopSettings(shop, updated);
    expect(prismaMock.setting.upsert).toHaveBeenCalled();
    expect(prismaMock.settingDiff.create).toHaveBeenCalledWith({
      data: { shop, timestamp: expect.any(String), diff: { currency: "USD" } },
    });
    expect(jsonMock.saveShopSettings).not.toHaveBeenCalled();
  });

  it("returns diff history from prisma", async () => {
    prismaMock.settingDiff.findMany.mockResolvedValue([
      { id: "1", shop, timestamp: "t", diff: { currency: "USD" } },
    ]);
    const res = await repo.diffHistory(shop);
    expect(res).toEqual([{ timestamp: "t", diff: { currency: "USD" } }]);
    expect(prismaMock.settingDiff.findMany).toHaveBeenCalledWith({
      where: { shop },
      orderBy: { timestamp: "asc" },
    });
    expect(jsonMock.diffHistory).not.toHaveBeenCalled();
  });
});
