import type { NextRequest } from "next/server";

import { corePageTemplates } from "@acme/templates";

jest.setTimeout(20000);

const req = (url: string) => new Request(url) as unknown as NextRequest;

describe("page template by name API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns template data when found", async () => {
    const first = corePageTemplates[0];
    const route = await import("../src/app/api/page-templates/[name]/route");
    const res = await route.GET(req("http://localhost"), {
      params: Promise.resolve({ name: first.id }),
    });
    const json = await res.json();
    expect(json).toEqual({
      id: first.id,
      name: first.label,
      category: first.category,
      pageType: first.pageType,
      version: first.version,
      origin: first.origin ?? "core",
      previewImage: first.previewImage ?? null,
      components: first.components,
    });
  });

  it("returns 404 when template missing", async () => {
    const route = await import("../src/app/api/page-templates/[name]/route");
    const res = await route.GET(req("http://localhost"), {
      params: Promise.resolve({ name: "missing-template-id" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
});
