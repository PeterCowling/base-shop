/**
 * Tests for login API route
 * MVP-B1: Invite-only auth system
 */

import { POST } from "./route";

describe("/api/auth/login", () => {
  it("should return 400 for missing credentials", async () => {
    const request = new Request("http://localhost:3020/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 401 for invalid credentials", async () => {
    const request = new Request("http://localhost:3020/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "pete",
        passcode: "wrong-passcode",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should return 200 for valid credentials", async () => {
    const request = new Request("http://localhost:3020/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "pete",
        passcode: "pete123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe("pete");
  });

  it("should set session cookie", async () => {
    const request = new Request("http://localhost:3020/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "pete",
        passcode: "pete123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Check for Set-Cookie header
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("current_user_id=");
  });
});
