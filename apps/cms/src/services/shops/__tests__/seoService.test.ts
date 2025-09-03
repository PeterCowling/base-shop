import { updateSeo } from "../seoService";
import { authorize, fetchSettings, persistSettings } from "../helpers";
import { revalidatePath } from "next/cache";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn().mockResolvedValue({}),
  persistSettings: jest.fn().mockResolvedValue(undefined),
  fetchDiffHistory: jest.fn(),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("seo service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authorize as jest.Mock).mockResolvedValue(undefined);
    (fetchSettings as jest.Mock).mockResolvedValue({});
    (persistSettings as jest.Mock).mockResolvedValue(undefined);
  });

  it("warns about long title and description", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "t".repeat(71));
    fd.append("description", "d".repeat(161));
    const result = await updateSeo("shop", fd);
    expect(result.warnings).toContain("Title exceeds 70 characters");
    expect(result.warnings).toContain("Description exceeds 160 characters");
  });

  it("returns errors for invalid payload without persisting", async () => {
    const fd = new FormData();
    fd.append("locale", "en");
    const result = await updateSeo("shop", fd);
    expect(result.errors).toBeDefined();
    expect(fetchSettings).not.toHaveBeenCalled();
    expect(persistSettings).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("throws when authorization fails", async () => {
    (authorize as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    await expect(updateSeo("shop", new FormData())).rejects.toThrow("nope");
    expect(fetchSettings).not.toHaveBeenCalled();
  });

  it("persists settings and revalidates path on success", async () => {
    (fetchSettings as jest.Mock).mockResolvedValue({});
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "Title");
    fd.append("description", "Desc");
    fd.append("canonicalBase", "https://shop.com");
    fd.append("image", "https://img.com/a.png");
    await updateSeo("shop", fd);
    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        seo: expect.objectContaining({
          en: expect.objectContaining({
            title: "Title",
            description: "Desc",
            canonicalBase: "https://shop.com",
            image: "https://img.com/a.png",
          }),
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/cms/shop/shop/settings/seo");
  });

  it("returns errors when persistence fails", async () => {
    (persistSettings as jest.Mock).mockRejectedValueOnce(new Error("db"));
    const fd = new FormData();
    fd.append("locale", "en");
    fd.append("title", "t");
    const result = await updateSeo("shop", fd);
    expect(result.errors).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  describe("conditional meta updates", () => {
    it("preserves existing meta when optional fields absent", async () => {
      (fetchSettings as jest.Mock).mockResolvedValue({
        seo: {
          en: {
            title: "old",
            description: "old",
            canonicalBase: "https://old.com",
            image: "https://old.com/old.png",
          },
        },
      });
      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "new");
      fd.append("description", "newdesc");
      await updateSeo("shop", fd);
      expect(persistSettings).toHaveBeenCalledWith(
        "shop",
        expect.objectContaining({
          seo: expect.objectContaining({
            en: expect.objectContaining({
              canonicalBase: "https://old.com",
              image: "https://old.com/old.png",
            }),
          }),
        }),
      );
    });

    it("updates meta when optional fields provided", async () => {
      (fetchSettings as jest.Mock).mockResolvedValue({
        seo: {
          en: {
            title: "old",
            description: "old",
            canonicalBase: "https://old.com",
            image: "https://old.com/old.png",
          },
        },
      });
      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("title", "new");
      fd.append("description", "newdesc");
      fd.append("canonicalBase", "https://new.com");
      fd.append("image", "https://new.com/new.png");
      await updateSeo("shop", fd);
      expect(persistSettings).toHaveBeenCalledWith(
        "shop",
        expect.objectContaining({
          seo: expect.objectContaining({
            en: expect.objectContaining({
              canonicalBase: "https://new.com",
              image: "https://new.com/new.png",
            }),
          }),
        }),
      );
    });
  });
});

