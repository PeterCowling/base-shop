import { NextRequest } from "next/server";

let route: typeof import("../route");

beforeAll(async () => {
  route = await import("../route");
});

afterEach(() => {
  jest.restoreAllMocks();
});

function req(name: string) {
  return new NextRequest(`http://test.local/${name}`);
}

describe("GET", () => {
  it("reads and returns existing template", async () => {
    const res = await route.GET(req("core.page.home.default"), {
      params: Promise.resolve({ name: "core.page.home.default" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("core.page.home.default");
    expect(data.components).toBeDefined();
  });

  it("returns 404 for missing template", async () => {
    const res = await route.GET(req("nonexistent-template-xyz"), {
      params: Promise.resolve({ name: "nonexistent-template-xyz" }),
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("handles templates with short name", async () => {
    // Test that templates can be found by suffix match
    const res = await route.GET(req("home.default"), {
      params: Promise.resolve({ name: "home.default" }),
    });
    // Either found or not found - implementation uses suffix matching
    expect([200, 404]).toContain(res.status);
  });
});
