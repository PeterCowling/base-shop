import { server } from "./server";

describe("msw configurator handlers", () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

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
});
