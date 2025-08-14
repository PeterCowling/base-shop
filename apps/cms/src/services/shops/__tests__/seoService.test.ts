import { updateSeo } from "../seoService";
import { authorize } from "../authorization";
import { fetchSettings, persistSettings } from "../persistence";
import { parseSeoForm } from "../validation";

jest.mock("../authorization", () => ({ authorize: jest.fn() }));
jest.mock("../persistence", () => ({
  fetchSettings: jest.fn().mockResolvedValue({}),
  persistSettings: jest.fn(),
}));
jest.mock("../validation", () => ({
  parseSeoForm: jest.fn(),
}));

describe("seoService", () => {
  it("updates seo and reports warnings", async () => {
    (parseSeoForm as jest.Mock).mockReturnValue({
      data: {
        locale: "en",
        title: "t".repeat(71),
        description: "d".repeat(161),
        image: "img",
        alt: "alt",
        canonicalBase: "base",
        ogUrl: "",
        twitterCard: "",
      },
      errors: undefined,
    });
    const result = await updateSeo("shop", new FormData());
    expect(authorize).toHaveBeenCalled();
    expect(persistSettings).toHaveBeenCalled();
    expect(result.warnings).toEqual([
      "Title exceeds 70 characters",
      "Description exceeds 160 characters",
    ]);
  });
});
