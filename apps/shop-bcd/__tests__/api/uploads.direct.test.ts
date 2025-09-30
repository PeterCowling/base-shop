// apps/shop-bcd/__tests__/api/uploads.direct.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../../src/app/api/uploads/direct/route";
import { asNextJson } from "@acme/test-utils";

describe("uploads/direct route", () => {
  it("rejects non-image contentType", async () => {
    const req = asNextJson({ contentType: "application/pdf", idempotencyKey: "8a074e68-1234-4abc-9def-aaaaaaaaaaaa" });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 500 when R2 env is missing", async () => {
    const req = asNextJson({ contentType: "image/png", idempotencyKey: "8a074e68-1234-4abc-9def-aaaaaaaaaaaa", filename: "x.png" });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("UNKNOWN");
  });
});

