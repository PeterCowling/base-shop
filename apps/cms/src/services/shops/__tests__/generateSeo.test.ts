import { generateMeta } from "@acme/lib";

import { authorize, fetchSettings, persistSettings } from "../helpers";
import { generateSeo } from "../seoService";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn().mockResolvedValue({}),
  persistSettings: jest.fn().mockResolvedValue(undefined),
  fetchDiffHistory: jest.fn(),
}));

jest.mock("@acme/lib", () => ({
  generateMeta: jest.fn(),
}));

describe("generateSeo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authorize as jest.Mock).mockResolvedValue(undefined);
    (fetchSettings as jest.Mock).mockResolvedValue({});
    (persistSettings as jest.Mock).mockResolvedValue(undefined);
    (generateMeta as jest.Mock).mockResolvedValue({
      title: "gen title",
      description: "gen desc",
      image: "gen.png",
    });
  });

  it("returns validation errors from parseGenerateSeoForm", async () => {
    const fd = new FormData();
    const result = await generateSeo("shop", fd);
    expect(result.errors).toBeDefined();
    expect(fetchSettings).not.toHaveBeenCalled();
    expect(persistSettings).not.toHaveBeenCalled();
    expect(generateMeta).not.toHaveBeenCalled();
  });

  it("persists generated seo and returns result", async () => {
    const fd = new FormData();
    fd.append("id", "123");
    fd.append("locale", "en");
    fd.append("title", "Title");
    fd.append("description", "Desc");

    const generated = {
      title: "gen title",
      description: "gen desc",
      image: "gen.png",
    };
    (generateMeta as jest.Mock).mockResolvedValueOnce(generated);

    const result = await generateSeo("shop", fd);

    expect(generateMeta).toHaveBeenCalledWith({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    expect(persistSettings).toHaveBeenCalledWith(
      "shop",
      expect.objectContaining({
        seo: expect.objectContaining({
          en: expect.objectContaining({
            title: generated.title,
            description: generated.description,
            image: generated.image,
            openGraph: expect.objectContaining({ image: generated.image }),
          }),
        }),
      }),
    );

    expect(result).toEqual({ generated });
  });

  it("throws when authorization fails", async () => {
    (authorize as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    await expect(generateSeo("shop", new FormData())).rejects.toThrow("nope");
    expect(fetchSettings).not.toHaveBeenCalled();
    expect(persistSettings).not.toHaveBeenCalled();
    expect(generateMeta).not.toHaveBeenCalled();
  });

  it("throws when persisting settings fails", async () => {
    const fd = new FormData();
    fd.append("id", "123");
    fd.append("locale", "en");
    fd.append("title", "Title");
    fd.append("description", "Desc");
    (persistSettings as jest.Mock).mockRejectedValueOnce(new Error("db"));
    await expect(generateSeo("shop", fd)).rejects.toThrow("db");
  });
});
