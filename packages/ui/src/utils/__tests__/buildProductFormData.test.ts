import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { buildProductFormData } from "../buildProductFormData";

describe("buildProductFormData", () => {
  it("creates FormData with product fields", () => {
    const product: ProductPublication & { variants: Record<string, string[]> } = {
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

    const locales: readonly Locale[] = ["en", "de"];
    const fd = buildProductFormData(product, ["loc1"], locales);

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
      ])
    );
  });
});
