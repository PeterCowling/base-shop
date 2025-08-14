import { pageComponentSchema } from "@acme/types/page";

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

  it("accepts ProductGrid with viewport counts", () => {
    const res = pageComponentSchema.safeParse({
      id: "1",
      type: "ProductGrid",
      desktopItems: 4,
      tabletItems: 2,
      mobileItems: 1,
    });
    expect(res.success).toBe(true);
  });
});
