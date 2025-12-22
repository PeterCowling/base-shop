// apps/cover-me-pretty/__tests__/api/tryon.garment.sse.test.ts

import { POST } from "../../src/app/api/tryon/garment/route";
// Polyfill ReadableStream for Jest Node environment
import { ReadableStream } from "node:stream/web";
import { Response as UndiciResponse, Headers as UndiciHeaders } from "undici";

const globalWithStream = globalThis as {
  ReadableStream?: typeof ReadableStream;
};

if (!globalWithStream.ReadableStream) {
  globalWithStream.ReadableStream = ReadableStream;
}

import { asNextJson } from "@acme/test-utils";

describe("tryon/garment SSE route", () => {
  const originalResponse = globalThis.Response;
  const originalHeaders = globalThis.Headers;

  beforeAll(() => {
    globalThis.Response = UndiciResponse as typeof globalThis.Response;
    globalThis.Headers = UndiciHeaders as typeof globalThis.Headers;
  });

  afterAll(() => {
    globalThis.Response = originalResponse;
    globalThis.Headers = originalHeaders;
  });

  async function readResponseBody(res: Response): Promise<string> {
    const decoder = new TextDecoder();
    let output = "";
    const body = res.body as unknown;
    if (!body) {
      const init = (res as { _bodyInit?: unknown })._bodyInit;
      if (typeof init === "string") return init;
      if (init && typeof (init as ReadableStream<Uint8Array>).getReader === "function") {
        const reader = (init as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) output += decoder.decode(value, { stream: true });
        }
        output += decoder.decode();
        return output;
      }
      return res.text();
    }
    if (body && typeof (body as ReadableStream<Uint8Array>).getReader === "function") {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) output += decoder.decode(value, { stream: true });
      }
      output += decoder.decode();
      return output;
    }
    if (body && Symbol.asyncIterator in (body as object)) {
      for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
        if (typeof chunk === "string") {
          output += chunk;
        } else {
          output += decoder.decode(chunk, { stream: true });
        }
      }
      output += decoder.decode();
      return output;
    }
    if (body && typeof (body as { on?: unknown }).on === "function") {
      return await new Promise<string>((resolve, reject) => {
        let data = "";
        (body as NodeJS.ReadableStream)
          .on("data", (chunk) => {
            data += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
          })
          .on("end", () => resolve(data + decoder.decode()))
          .on("error", reject);
      });
    }
    const init = (res as { _bodyInit?: unknown })._bodyInit;
    if (typeof init === "string") return init;
    if (init && typeof (init as ReadableStream<Uint8Array>).getReader === "function") {
      const reader = (init as ReadableStream<Uint8Array>).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) output += decoder.decode(value, { stream: true });
      }
      output += decoder.decode();
      return output;
    }
    return res.text();
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
    const text = await readResponseBody(res);
    expect(text).toContain("event: ack\n");
    expect(text).toContain("event: final\n");
    // basic framing: events separated by double newlines
    expect(text.includes("\n\n")).toBe(true);
  });
});
