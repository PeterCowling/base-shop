import type { NextRequest } from "next/server";

import { POST } from "./route";

function mockRequest(body: unknown, opts?: { consent?: boolean; analyticsEnabled?: boolean }) {
  const consent = opts?.consent ?? true;
  const req = {
    cookies: {
      get: () => (consent ? { value: "true" } : undefined),
    },
    json: async () => body,
    url: "http://localhost/api/analytics/event",
    headers: { get: () => null },
  } as unknown as NextRequest;
  return req;
}

describe("analytics event handler", () => {
  it("returns 202 when no consent", async () => {
    const res = await POST(mockRequest({ type: "page_view", path: "/" }, { consent: false }));
    expect(res.status).toBe(202);
  });

  it("rejects invalid payload", async () => {
    const res = await POST(mockRequest({ type: "unknown" }));
    expect(res.status).toBe(400);
  });

  it("accepts page_view with consent", async () => {
    const res = await POST(mockRequest({ type: "page_view", path: "/shop" }));
    expect(res.status).toBe(200);
  });
});
