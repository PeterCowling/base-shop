// apps/cover-me-pretty/__tests__/api/tryon.garment.sse.test.ts

import { POST } from "../../src/app/api/tryon/garment/route";
// Polyfill ReadableStream for Jest Node environment
import { ReadableStream } from "node:stream/web";

const globalWithStream = globalThis as {
  ReadableStream?: typeof ReadableStream;
};

if (!globalWithStream.ReadableStream) {
  globalWithStream.ReadableStream = ReadableStream;
}

import { asNextJson } from "@acme/test-utils";

describe("tryon/garment SSE route", () => {
  it("emits valid SSE events with ack and final when no upstream", async () => {
    delete process.env.TRYON_HEAVY_API_URL; // ensure synthetic path
    const idem = "8a074e68-1234-4abc-9def-aaaaaaaaaaaa";
    const payload = {
      mode: "garment" as const,
      productId: "sku-123",
      sourceImageUrl: "https://r2.example/tryon/u_abc/2025/09/29/a.jpg",
      garmentAssets: {},
    };
    const req = asNextJson(payload, { headers: { "Idempotency-Key": idem } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("event: ack\n");
    expect(text).toContain("event: final\n");
    // basic framing: events separated by double newlines
    expect(text.includes("\n\n")).toBe(true);
  });
});
