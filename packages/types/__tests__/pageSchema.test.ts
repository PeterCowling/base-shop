import { pageSchema } from "../src/Page.ts";

describe("pageSchema", () => {
  it("parses valid data", () => {
    const valid = {
      id: "p1",
      slug: "home",
      status: "draft",
      components: [
        { id: "c1", type: "Text", text: "Hello" },
        { id: "c2", type: "Image", src: "img.jpg" },
      ],
      seo: { title: { en: "Home" } },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      createdBy: "user",
    };
    expect(pageSchema.parse(valid)).toEqual(valid);
  });

  it("rejects unknown component type", () => {
    const invalid = {
      id: "p1",
      slug: "home",
      status: "draft",
      components: [{ id: "c1", type: "Unknown" }],
      seo: { title: { en: "Home" } },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      createdBy: "user",
    };
    expect(pageSchema.safeParse(invalid).success).toBe(false);
  });

  it("fails when slug missing", () => {
    const invalid = {
      id: "p1",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      createdBy: "user",
    } as any;
    expect(pageSchema.safeParse(invalid).success).toBe(false);
  });
});
