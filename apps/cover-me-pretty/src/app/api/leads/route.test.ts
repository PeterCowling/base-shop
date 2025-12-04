import { POST } from "./route";
import type { NextRequest } from "next/server";

function mockRequest(body: unknown, opts?: { consent?: boolean }) {
  const consent = opts?.consent ?? true;
  const req = {
    cookies: {
      get: () => (consent ? { value: "true" } : undefined),
    },
    json: async () => body,
    url: "http://localhost/api/leads",
    headers: { get: () => null },
  } as unknown as NextRequest;
  return req;
}

describe("leads handler", () => {
  it("accepts newsletter lead", async () => {
    const res = await POST(
      mockRequest({ type: "newsletter", email: "test@example.com", locale: "en" })
    );
    expect(res.status).toBe(200);
  });

  it("rejects invalid lead", async () => {
    const res = await POST(mockRequest({ email: "bad" }));
    expect(res.status).toBe(400);
  });
});
