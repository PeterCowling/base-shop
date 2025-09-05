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
