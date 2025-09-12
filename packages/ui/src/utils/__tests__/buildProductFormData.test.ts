import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { buildProductFormData } from "../buildProductFormData";

const locales: readonly Locale[] = ["en", "de"];
const baseProduct: ProductPublication & { variants: Record<string, string[]> } = {
  id: "p1",
  sku: "sku1",
  title: { en: "EN", de: "DE" },
  description: { en: "Desc EN", de: "Desc DE" },
  price: 100,
  currency: "EUR",
  media: [],
  created_at: "2023-01-01",
  updated_at: "2023-01-01",
  shop: "shop",
  status: "draft",
  row_version: 1,
  variants: { size: ["m", "l"] },
};

describe("buildProductFormData", () => {
  it("builds correct FormData for given product input", () => {
    const fd = buildProductFormData(baseProduct, ["loc1"], locales);
    const entries = Array.from(fd.entries());
    expect(entries).toEqual(
      expect.arrayContaining([
        ["id", "p1"],
        ["title_en", "EN"],
        ["desc_en", "Desc EN"],
        ["title_de", "DE"],
        ["desc_de", "Desc DE"],
        ["price", "100"],
        ["publish", "loc1"],
        ["variant_size", "m,l"],
        ["media", "[]"],
      ])
    );
  });

  it("omits undefined variant values", () => {
    const product = {
      ...baseProduct,
      variants: { size: ["m", undefined as any, "", "l"] },
    };
    const fd = buildProductFormData(product, [], locales);
    expect(fd.get("variant_size")).toBe("m,l");
  });

  it("handles images/media arrays", () => {
    const file = new File(["hello"], "image.png", { type: "image/png" });
    const product = {
      ...baseProduct,
      media: [
        { id: "1", alt: "first", file },
        { id: "2", alt: "second" },
      ],
    };
    const fd = buildProductFormData(product, [], locales);

    expect(fd.get("file_0")).toBe(file);
    expect(fd.get("file_1")).toBeNull();

    const media = fd.get("media");
    expect(media).toBe(
      JSON.stringify([
        { id: "1", alt: "first" },
        { id: "2", alt: "second" },
      ])
    );
  });
});

