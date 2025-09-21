import { buildProductFormData } from "../buildProductFormData";

describe("buildProductFormData", () => {
  it("serializes core fields, locales, media (stripping File), and variants", () => {
    const file = new File([new Blob(["abc"])], "a.png", { type: "image/png" });
    const product: any = {
      id: "p1",
      title: { en: "Hat", fr: "Chapeau" },
      description: { en: "Nice", fr: "Joli" },
      price: 1299,
      media: [
        { id: "m1", url: "/img1.png" },
        { id: "m2", url: "/img2.png", file },
        null,
      ],
      variants: { color: ["red", "blue", ""], size: ["m"] },
    };
    const fd = buildProductFormData(product, ["storefront", "bcd"], ["en", "fr"] as const);
    const entries = Array.from((fd as any).entries()) as [string, any][];
    const map = Object.fromEntries(entries);
    expect(map.id).toBe("p1");
    expect(map.title_en).toBe("Hat");
    expect(map.title_fr).toBe("Chapeau");
    expect(map.desc_en).toBe("Nice");
    expect(map.desc_fr).toBe("Joli");
    expect(map.price).toBe("1299");
    // file_1 should exist and be a File; file_0 not present
    expect(map.file_1).toBe(file);
    expect(map.file_0).toBeUndefined();
    // media JSON strips File and keeps nulls positionally
    const media = JSON.parse(map.media);
    expect(media).toEqual([
      { id: "m1", url: "/img1.png" },
      { id: "m2", url: "/img2.png" },
      null,
    ]);
    expect(map.publish).toBe("storefront,bcd");
    expect(map.variant_color).toBe("red,blue");
    expect(map.variant_size).toBe("m");
  });
});

