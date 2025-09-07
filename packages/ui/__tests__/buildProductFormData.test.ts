import { buildProductFormData } from "../src/utils/buildProductFormData";

describe("buildProductFormData", () => {
  const locales = ["en"] as const;

  const baseProduct: any = {
    id: "p1",
    sku: "sku1",
    title: { en: "Name" },
    description: { en: "Desc" },
    price: 100,
    currency: "USD",
    media: [],
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    shop: "shop",
    status: "draft",
    row_version: 1,
    variants: {},
  };

  it("builds FormData with basic product info", () => {
    const fd = buildProductFormData(baseProduct, [], locales);
    expect(fd.get("title_en")).toBe("Name");
    expect(fd.get("price")).toBe("100");
  });

  it("handles optional fields and empty arrays", () => {
    const product = {
      ...baseProduct,
      media: [],
      variants: { size: [], color: ["red", ""] },
    };

    const fd = buildProductFormData(product, [], locales);

    expect(fd.get("media")).toBe("[]");
    expect(fd.get("publish")).toBe("");
    expect(fd.get("variant_size")).toBe("");
    expect(fd.get("variant_color")).toBe("red");
  });

  it("handles file attachments in media", () => {
    const file = new File(["data"], "image.png", { type: "image/png" });
    const product = {
      ...baseProduct,
      media: [{ url: "", type: "image", file }],
    };

    const fd = buildProductFormData(product, [], locales);

    expect(fd.get("file_0")).toBe(file);
    const media = JSON.parse(fd.get("media") as string);
    expect(media[0].file).toBeUndefined();
  });
});

