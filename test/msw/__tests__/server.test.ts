import { server } from "../server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("msw server handlers", () => {
  test("POST /cms/api/configurator returns default message", async () => {
    const res = await fetch("http://localhost/cms/api/configurator", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, message: "default handler: OK" });
  });

  test("GET /cms/api/configurator/validate-env/:shop returns success", async () => {
    const res = await fetch(
      "http://localhost/cms/api/configurator/validate-env/my-shop"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  test("GET /cms/api/page-templates returns empty array", async () => {
    const res = await fetch("http://localhost/cms/api/page-templates");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  test("GET /cms/api/configurator-progress returns default state", async () => {
    const res = await fetch("http://localhost/cms/api/configurator-progress");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ state: {}, completed: {} });
  });

  test("PUT /cms/api/configurator-progress returns empty object", async () => {
    const res = await fetch("http://localhost/cms/api/configurator-progress", {
      method: "PUT",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });

  test("PATCH /cms/api/configurator-progress returns empty object", async () => {
    const res = await fetch("http://localhost/cms/api/configurator-progress", {
      method: "PATCH",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });

  test("GET /api/publish-locations returns sample data", async () => {
    const res = await fetch("http://localhost/api/publish-locations");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([
      {
        id: "homepage-hero",
        name: "Homepage hero",
        path: "homepage/hero",
        requiredOrientation: "landscape",
      },
    ]);
  });
});
