import type { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import { onRequest as componentsHandler } from "../src/routes/components/[shopId]";
import { onRequestPost as publishUpgradeHandler } from "../src/routes/shop/[id]/publish-upgrade";

async function collectBody(
  req: IncomingMessage,
): Promise<Uint8Array | undefined> {
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

export interface ApiTestResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  text: string;
}

export async function apiRequest(
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    json?: unknown;
  } = {},
): Promise<ApiTestResponse> {
  const handler = createRequestHandler();

  const req = new Readable({
    read() {
      if (options.json !== undefined) {
        this.push(JSON.stringify(options.json));
      }
      this.push(null);
    },
  }) as unknown as IncomingMessage;
  req.url = path;
  req.method = method;
  req.headers = options.headers ?? {};

  const headers: Record<string, string> = {};
  let text = "";

  const res = {
    statusCode: 200,
    setHeader: (key: string, value: string) => {
      headers[key.toLowerCase()] = value;
    },
    end: (chunk?: unknown) => {
      if (chunk === undefined || chunk === null) return;
      if (chunk instanceof Buffer) {
        text += chunk.toString("utf8");
      } else {
        text += String(chunk);
      }
    },
  } as unknown as ServerResponse;

  await handler(req, res);

  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    status: res.statusCode,
    headers,
    body,
    text,
  };
}
