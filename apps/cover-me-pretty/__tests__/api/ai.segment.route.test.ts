// apps/cover-me-pretty/__tests__/api/ai.segment.route.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../../src/app/api/ai/segment/route";
import { asNextJson } from "@acme/test-utils";

describe("ai/segment route", () => {
  beforeEach(() => {
    process.env.TRYON_PROVIDER = "external-api"; // no segmenter → returns {}
  });

  it("validates body and returns {} when provider missing", async () => {
    const body = { imageUrl: "https://r2.example/obj.png", idempotencyKey: "8a074e68-1234-4abc-9def-aaaaaaaaaaaa" };
    const req = asNextJson(body);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });
});
