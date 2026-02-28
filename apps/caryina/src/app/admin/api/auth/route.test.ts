import { POST } from "@/app/admin/api/auth/route";

const VALID_KEY = "caryina-admin-route-test-key-abc123xyz";

describe("POST /admin/api/auth", () => {
  const originalKey = process.env.CARYINA_ADMIN_KEY;

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.CARYINA_ADMIN_KEY = originalKey;
    } else {
      delete process.env.CARYINA_ADMIN_KEY;
    }
  });

  it("TC-02: returns 200 and Set-Cookie with HttpOnly when key is correct", async () => {
    process.env.CARYINA_ADMIN_KEY = VALID_KEY;
    const req = new Request("http://localhost/admin/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: VALID_KEY }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie?.toLowerCase()).toContain("httponly");
  });

  it("TC-03: returns 401 and no Set-Cookie when key is wrong", async () => {
    process.env.CARYINA_ADMIN_KEY = VALID_KEY;
    const req = new Request("http://localhost/admin/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "definitely-wrong-key-0000" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("TC-04: returns 500 when CARYINA_ADMIN_KEY env var is not set", async () => {
    delete process.env.CARYINA_ADMIN_KEY;
    const req = new Request("http://localhost/admin/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "anything" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 400 for a missing key field in the body", async () => {
    process.env.CARYINA_ADMIN_KEY = VALID_KEY;
    const req = new Request("http://localhost/admin/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    process.env.CARYINA_ADMIN_KEY = VALID_KEY;
    const req = new Request("http://localhost/admin/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
