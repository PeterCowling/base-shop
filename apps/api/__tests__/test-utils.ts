import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import { onRequest as componentsHandler } from "../src/routes/components/[shopId]";
import { onRequestPost as publishUpgradeHandler } from "../src/routes/shop/[id]/publish-upgrade";

async function collectBody(req: IncomingMessage): Promise<Uint8Array | undefined> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
}

export function createRequestHandler() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", "http://test");
    const method = req.method || "GET";
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(","));
      else if (value !== undefined) headers.set(key, value);
    }
    const body = await collectBody(req);
    const request = new Request(url.toString(), {
      method,
      headers,
      body,
    });

    let response: Response | undefined;
    if (method === "GET" && url.pathname.startsWith("/components/")) {
      const shopId = url.pathname.split("/")[2];
      response = await componentsHandler({ params: { shopId }, request });
    } else if (
      method === "POST" &&
      url.pathname.startsWith("/shop/") &&
      url.pathname.endsWith("/publish-upgrade")
    ) {
      const id = url.pathname.split("/")[2];
      response = await publishUpgradeHandler({ params: { id }, request });
    }

    if (!response) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const text = await response.text();
    res.end(text);
  };
}

if (require.main === module) {
  describe("createRequestHandler", () => {
    it("joins array header values", async () => {
      const handler = createRequestHandler();

      const req = new Readable({
        read() {
          this.push(null);
        },
      }) as unknown as IncomingMessage;
      req.url = "/unknown";
      req.method = "GET";
      req.headers = { "x-multi": ["a", "b"] } as unknown as IncomingMessage["headers"];

      const end = jest.fn();
      const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

      const OriginalRequest = global.Request;
      const RequestMock = jest.fn((input: RequestInfo, init?: RequestInit) =>
        new OriginalRequest(input, init),
      );
      (global as any).Request = RequestMock;

      await handler(req, res);

      expect(RequestMock).toHaveBeenCalled();
      const headers = (RequestMock.mock.calls[0][1]!.headers as Headers) || new Headers();
      expect(headers.get("x-multi")).toBe("a,b");

      (global as any).Request = OriginalRequest;
    });

    it("uses undefined body when request lacks body", async () => {
      const handler = createRequestHandler();

      const req = new Readable({
        read() {
          this.push(null);
        },
      }) as unknown as IncomingMessage;
      req.url = "/unknown";
      req.method = "GET";
      req.headers = {};

      const end = jest.fn();
      const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

      const OriginalRequest = global.Request;
      const RequestMock = jest.fn((input: RequestInfo, init?: RequestInit) =>
        new OriginalRequest(input, init),
      );
      (global as any).Request = RequestMock;

      await handler(req, res);

      expect(RequestMock).toHaveBeenCalled();
      expect(RequestMock.mock.calls[0][1]!.body).toBeUndefined();

      (global as any).Request = OriginalRequest;
    });

    it("returns 404 for unrecognized path", async () => {
      const handler = createRequestHandler();

      const req = new Readable({
        read() {
          this.push(null);
        },
      }) as unknown as IncomingMessage;
      req.url = "/not-found";
      req.method = "GET";
      req.headers = {};

      const end = jest.fn();
      const res = { statusCode: 200, setHeader: jest.fn(), end } as unknown as ServerResponse;

      await handler(req, res);

      expect(res.statusCode).toBe(404);
      expect(end).toHaveBeenCalled();
    });
  });
}
