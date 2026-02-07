(process.env as Record<string, string>).NODE_ENV = "development";
import { __setMockSession } from "next-auth";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import "../../../apps/cms/src/types/next-auth.d.ts";

const mockGetShopSettings = jest.fn();
const mockSaveShopSettings = jest.fn();

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  getShopSettings: (...args: any[]) => mockGetShopSettings(...args),
  saveShopSettings: (...args: any[]) => mockSaveShopSettings(...args),
}));
jest.mock("@acme/platform-core/repositories/json.server", () => ({}));

import { updateSeo } from "../../../apps/cms/src/actions/shops.server";
import { getSeo } from "../../../packages/template-app/src/lib/seo";

beforeEach(() => {
  jest.clearAllMocks();
  mockGetShopSettings.mockResolvedValue({ languages: ["en"] });
  mockSaveShopSettings.mockResolvedValue(undefined);
  __setMockSession({ user: { role: "admin" } } as any);
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
    fd.append("description", "b");
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
    fd.append("image", "not-a-url");
    const result = await updateSeo("shop", fd);
    expect(result.errors?.image).toBeDefined();
  });
});

describe("canonical merge", () => {
  beforeEach(() => {
    mockGetShopSettings.mockResolvedValue({
      languages: ["en"],
      seo: { en: { canonicalBase: "https://base.com" } },
    });
  });

  it("uses page canonical when provided", async () => {
    const seo = await getSeo("en", { canonical: "https://page.com/foo" });
    expect(seo.canonical).toBe("https://base.com/foo");
  });

  it("falls back to shop canonical", async () => {
    const seo = await getSeo("en");
    expect(seo.canonical).toBe("https://base.com/en");
  });
});

describe("hreflang generation", () => {
  beforeEach(() => {
    mockGetShopSettings.mockResolvedValue({
      languages: ["en", "de"],
      seo: {
        en: { canonicalBase: "https://site.com" },
        de: { canonicalBase: "https://site.de" },
      },
    });
  });

  it("returns per-locale canonical and alternate links", async () => {
    const seo = await getSeo("en", {
      canonical: "https://site.com/en/about",
    });
    expect(seo.canonical).toBe("https://site.com/about");
    expect(seo.additionalLinkTags).toEqual([
      { rel: "alternate", hrefLang: "en", href: "https://site.com/about" },
      { rel: "alternate", hrefLang: "de", href: "https://site.de/about" },
    ]);
  });
});
