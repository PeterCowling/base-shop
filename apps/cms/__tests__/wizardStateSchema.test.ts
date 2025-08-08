import { wizardStateSchema } from "../src/app/cms/wizard/schema";

describe("wizardStateSchema", () => {
  it("rejects invalid top-level components", () => {
    const result = wizardStateSchema.safeParse({
      components: [{ id: "1" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid page components", () => {
    const localeRecord = { en: "", de: "", it: "" };
    const result = wizardStateSchema.safeParse({
      pages: [
        {
          slug: "test",
          title: localeRecord,
          description: localeRecord,
          image: localeRecord,
          components: [{ id: "1" }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
