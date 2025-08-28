import Ajv from "ajv";
import schema from "@acme/platform-core/repositories/pages/schema.json";

describe("page component discriminated union", () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema as any);

  const basePage = {
    id: "p1",
    slug: "home",
    status: "draft",
    components: [] as any[],
    seo: { title: "Home" },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    createdBy: "tester",
  };

  it("accepts a valid component", () => {
    const page = {
      ...basePage,
      components: [{ id: "c1", type: "HeroBanner" }],
    };
    expect(validate(page)).toBe(true);
  });

  it("rejects component with invalid prop", () => {
    const page = {
      ...basePage,
      components: [{ id: "c1", type: "HeroBanner", extra: "nope" }],
    };
    expect(validate(page)).toBe(false);
  });
});
