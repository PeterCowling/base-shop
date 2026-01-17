// apps/cover-me-pretty/__tests__/api/tryon.garment.sse.test.ts

import { POST } from "../../src/app/api/tryon/garment/route";
// Polyfill ReadableStream for Jest Node environment
import { ReadableStream } from "node:stream/web";
const globalWithStream = globalThis as {
  ReadableStream?: typeof ReadableStream;
};

const nativeReadableStream = globalWithStream.ReadableStream ?? ReadableStream;

if (!globalWithStream.ReadableStream) {
  globalWithStream.ReadableStream = ReadableStream;
}

import { asNextJson } from "@acme/test-utils";

describe("tryon/garment SSE route", () => {
  let lastStream: { chunks: Uint8Array[]; done: Promise<void> } | null = null;

  class CapturedReadableStream {
    constructor({
      start,
    }: {
      start: (controller: {
        enqueue: (chunk: Uint8Array) => void;
        close: () => void;
      }) => void;
    }) {
      const chunks: Uint8Array[] = [];
      let resolveDone: () => void = () => {};
      const done = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });
      lastStream = { chunks, done };
      Promise.resolve(
        start({
          enqueue: (chunk) => chunks.push(chunk),
          close: () => {},
        }),
      ).finally(resolveDone);
    }
  }

  beforeEach(() => {
    globalThis.ReadableStream =
      CapturedReadableStream as unknown as typeof ReadableStream;
  });

  afterEach(() => {
    globalThis.ReadableStream = nativeReadableStream;
    lastStream = null;
  });

  function readCapturedText(): string {
    if (!lastStream) return "";
    const decoder = new TextDecoder();
    let output = "";
    for (const chunk of lastStream.chunks) {
      output += decoder.decode(chunk, { stream: true });
    }
    output += decoder.decode();
    return output;
  }

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
    if (lastStream) {
      await lastStream.done;
    }
    const text = readCapturedText();
    expect(text).toContain("event: ack\n");
    expect(text).toContain("event: final\n");
    // basic framing: events separated by double newlines
    expect(text.includes("\n\n")).toBe(true);
  });
});
