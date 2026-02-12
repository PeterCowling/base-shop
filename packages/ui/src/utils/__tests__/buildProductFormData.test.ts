/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import type { MediaItem } from "@acme/types";

import type { ProductWithVariants } from "../../hooks/useProductInputs";
import { buildProductFormData } from "../buildProductFormData";

describe("buildProductFormData", () => {
  it("serializes core fields, locales, media (stripping File), and variants", () => {
    const file = new File([new Blob(["abc"])], "a.png", { type: "image/png" });
    type ProductWithNullableMedia = Omit<ProductWithVariants, "media"> & {
      media: (MediaItem | null)[];
    };
    const product: ProductWithNullableMedia = {
      id: "p1",
      title: { en: "Hat", de: "Hut" },
      description: { en: "Nice", de: "Schön" },
      price: 1299,
      media: [
        { id: "m1", url: "/img1.png" },
        { id: "m2", url: "/img2.png", file },
        null,
      ],
      variants: { color: ["red", "blue", ""], size: ["m"] },
    };
    const fd = buildProductFormData(product as any, ["storefront", "bcd"], ["en", "de"] as const);
    const entries = Array.from(fd.entries());
    const map = Object.fromEntries(entries) as Record<string, FormDataEntryValue>;

    const s = (key: string) => map[key] as string; // string-valued entries
    const fval = (key: string) => map[key] as File | undefined; // file entries

    expect(s("id")).toBe("p1");
    expect(s("title_en")).toBe("Hat");
    expect(s("title_de")).toBe("Hut");
    expect(s("desc_en")).toBe("Nice");
    expect(s("desc_de")).toBe("Schön");
    expect(s("price")).toBe("1299");
    // file_1 should exist and be a File; file_0 not present
    expect(fval("file_1")).toBe(file);
    expect(map["file_0"]).toBeUndefined();
    // media JSON strips File and keeps nulls positionally
    const media = JSON.parse(s("media"));
    expect(media).toEqual([
      { id: "m1", url: "/img1.png" },
      { id: "m2", url: "/img2.png" },
      null,
    ]);
    expect(s("publish")).toBe("storefront,bcd");
    expect(s("variant_color")).toBe("red,blue");
    expect(s("variant_size")).toBe("m");
  });
});
