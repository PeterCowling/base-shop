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
      name: string;
      components: unknown[];
    }>;

    expect(Array.isArray(json)).toBe(true);
    // Should surface at least the core page templates.
    expect(json.length).toBeGreaterThanOrEqual(corePageTemplates.length);

    const labels = new Set(json.map((t) => t.name));
    for (const tpl of corePageTemplates) {
      expect(labels.has(tpl.label)).toBe(true);
    }
  });
});
