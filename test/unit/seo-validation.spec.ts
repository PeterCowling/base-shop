(process.env as Record<string, string>).NODE_ENV = "development";

jest.mock("next-auth", () => ({
  getServerSession: jest
    .fn()
    .mockResolvedValue({ user: { role: "admin" } } as any),
}));

import "../../apps/cms/src/types/next-auth.d.ts";

const getShopSettingsMock = jest.fn();
const saveShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops", () => ({
  getShopSettings: (...args: any[]) => getShopSettingsMock(...args),
  saveShopSettings: (...args: any[]) => saveShopSettingsMock(...args),
}));
jest.mock("@platform-core/repositories/json", () => ({}));

import { updateSeo } from "../../apps/cms/src/actions/shops.server";
import { getSeo } from "../../apps/shop-abc/src/app/lib/seo";

beforeEach(() => {
  jest.clearAllMocks();
  getShopSettingsMock.mockResolvedValue({ languages: ["en"] });
  saveShopSettingsMock.mockResolvedValue(undefined);
});

describe("updateSeo validation", () => {
  it("accepts title 70 chars and description 160 chars", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "a".repeat(70));
    fd.append("description", "b".repeat(160));
    const result = await updateSeo("shop", fd);
    expect(result.warnings).toEqual([]);
  });

  it("warns when title exceeds 70 chars", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "a".repeat(71));
    const result = await updateSeo("shop", fd);
    expect(result.warnings).toContain("Title exceeds 70 characters");
  });

  it("warns when description exceeds 160 chars", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "t");
    fd.append("description", "d".repeat(161));
    const result = await updateSeo("shop", fd);
    expect(result.warnings).toContain("Description exceeds 160 characters");
  });

  it("rejects invalid image URLs", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "t");
    fd.append("image", "ftp://bad");
    const result = await updateSeo("shop", fd);
    expect(result.errors?.image).toBeDefined();
  });
});

describe("canonical merge", () => {
  beforeEach(() => {
    getShopSettingsMock.mockResolvedValue({
      languages: ["en"],
      seo: { en: { canonical: "https://base.com" } },
    });
  });

  it("uses page canonical when provided", async () => {
    const seo = await getSeo("en", { canonical: "https://page.com/foo" });
    expect(seo.canonical).toBe("https://page.com/foo");
  });

  it("falls back to shop canonical", async () => {
    const seo = await getSeo("en");
    expect(seo.canonical).toBe("https://base.com");
  });
});
