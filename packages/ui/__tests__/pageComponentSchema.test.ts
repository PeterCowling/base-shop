import { pageComponentSchema } from "@types/Page";

describe("pageComponentSchema", () => {
  it("rejects unknown component type", () => {
    const res = pageComponentSchema.safeParse({ id: "1", type: "Foo" });
    expect(res.success).toBe(false);
  });

  it("rejects HeroBanner with invalid slides", () => {
    const res = pageComponentSchema.safeParse({
      id: "1",
      type: "HeroBanner",
      slides: [{ src: "/a.jpg" }],
    });
    expect(res.success).toBe(false);
  });

  it("rejects ValueProps with invalid items", () => {
    const res = pageComponentSchema.safeParse({
      id: "1",
      type: "ValueProps",
      items: [{ icon: "i", title: "t" }],
    });
    expect(res.success).toBe(false);
  });
});
