import { corePageTemplates } from "@acme/templates";

jest.setTimeout(20000);

describe("page templates list API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns core template list derived from @acme/templates", async () => {
    const route = await import("../src/app/api/page-templates/route");
    const res = await route.GET();
    const json = (await res.json()) as Array<{
      id: string;
      name: string;
      category: string;
      pageType?: string;
      version: string;
      previewImage: string | null;
      components: unknown[];
    }>;

    expect(Array.isArray(json)).toBe(true);
    // Should surface at least the core page templates.
    expect(json.length).toBeGreaterThanOrEqual(corePageTemplates.length);

    const labels = new Set(json.map((t) => t.name));
    for (const tpl of corePageTemplates) {
      expect(labels.has(tpl.label)).toBe(true);
      const match = json.find((t) => t.id === tpl.id);
      expect(match).toBeDefined();
      expect(match?.category).toBe(tpl.category);
      expect(match?.previewImage === null || typeof match?.previewImage === "string").toBe(true);
    }
  });

  it("filters templates by group", async () => {
    const route = await import("../src/app/api/page-templates/route");
    const req = new Request("http://localhost/cms/api/page-templates?group=product");
    const res = await route.GET(req as unknown as Request);
    const json = (await res.json()) as Array<{ id: string; components: unknown[] }>;
    expect(json.length).toBe(corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.product.")).length);
    json.forEach((tpl) => {
      expect(tpl.id.startsWith("core.page.product.")).toBe(true);
    });
  });
});
