import { NextRequest } from "next/server";
import type { TemplateDescriptor } from "@acme/page-builder-core";

// Mock the templates module
jest.mock("@acme/templates", () => ({
  corePageTemplates: [],
}));

let route: typeof import("../route");
let mockTemplates: TemplateDescriptor[];

beforeAll(async () => {
  const templatesModule = await import("@acme/templates");
  mockTemplates = templatesModule.corePageTemplates as unknown as TemplateDescriptor[];
  route = await import("../route");
});

afterEach(() => {
  mockTemplates.length = 0;
  jest.restoreAllMocks();
});

function req(name: string) {
  return new NextRequest(`http://test.local/${name}`);
}

describe("GET", () => {
  it("reads and returns existing template", async () => {
    mockTemplates.push({
      id: "core.page.home.default",
      version: "1.0.0",
      kind: "page",
      label: "Test Home",
      description: "Test template",
      category: "Commerce",
      pageType: "marketing",
      previewImage: "/test.svg",
      components: [{ id: "test", type: "TestComponent" }],
    });

    const res = await route.GET(req("home.default"), {
      params: Promise.resolve({ name: "home.default" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      id: "core.page.home.default",
      name: "Test Home",
      category: "Commerce",
      pageType: "marketing",
      version: "1.0.0",
      origin: "core",
      previewImage: "/test.svg",
      components: [{ id: "test", type: "TestComponent" }],
    });
  });

  it("returns 404 for missing template", async () => {
    const res = await route.GET(req("missing"), {
      params: Promise.resolve({ name: "missing" }),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });

  it("finds template by suffix when full id not provided", async () => {
    mockTemplates.push({
      id: "core.page.about.default",
      version: "1.0.0",
      kind: "page",
      label: "About Page",
      description: "Test template",
      category: "Marketing",
      pageType: "marketing",
      components: [],
    });

    const res = await route.GET(req("about.default"), {
      params: Promise.resolve({ name: "about.default" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("core.page.about.default");
  });
});
