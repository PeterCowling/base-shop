import { corePageTemplates } from "@acme/templates";

jest.setTimeout(20000);

describe("page template by name API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns template data when found", async () => {
    const first = corePageTemplates[0];
    const route = await import("../src/app/api/page-templates/[name]/route");
    const res = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ name: first.id }),
    });
    const json = await res.json();
    expect(json).toEqual({
      name: first.label,
      components: first.components,
    });
  });

  it("returns 404 when template missing", async () => {
    const route = await import("../src/app/api/page-templates/[name]/route");
    const res = await route.GET(new Request("http://localhost"), {
      params: Promise.resolve({ name: "missing-template-id" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
});
