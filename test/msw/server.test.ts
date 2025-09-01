import { server, rest } from "./server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("msw server handlers", () => {
  test("POST /cms/api/configurator", async () => {
    const res = await fetch("http://localhost/cms/api/configurator", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, message: "default handler: OK" });
  });

  test("GET /cms/api/configurator/validate-env/:shop", async () => {
    const res = await fetch(
      "http://localhost/cms/api/configurator/validate-env/my-shop"
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  test("GET /cms/api/page-templates", async () => {
    const res = await fetch("http://localhost/cms/api/page-templates");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  test("GET /cms/api/wizard-progress", async () => {
    const res = await fetch("http://localhost/cms/api/wizard-progress");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ state: {}, completed: {} });
  });

  test("PUT /cms/api/wizard-progress", async () => {
    const res = await fetch("http://localhost/cms/api/wizard-progress", {
      method: "PUT",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });

  test("PATCH /cms/api/wizard-progress", async () => {
    const res = await fetch("http://localhost/cms/api/wizard-progress", {
      method: "PATCH",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });
});
