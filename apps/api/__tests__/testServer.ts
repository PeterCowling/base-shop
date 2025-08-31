import { createServer, IncomingMessage } from "http";
import { onRequest as componentsHandler } from "../src/routes/components/[shopId]";
import { onRequestPost as publishUpgradeHandler } from "../src/routes/shop/[id]/publish-upgrade";

export async function createTestServer() {
  const handle = (_req: any, res: any) => {
    res.statusCode = 404;
    res.end();
  };

  return createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname.startsWith("/components/")) {
      const shopId = url.pathname.split("/")[2];
      const request = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as any,
      });
      const response = await componentsHandler({
        params: { shopId },
        request,
      } as any);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
      return;
    }
    const match = url.pathname.match(/^\/shop\/([^/]+)\/publish-upgrade$/);
    if (match) {
      const id = match[1];
      const body = await collectBody(req);
      const response = await publishUpgradeHandler({
        params: { id },
        request: new Request(url.toString(), {
          method: req.method,
          headers: req.headers as any,
          body,
        }),
      } as any);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
      return;
    }
    handle(req, res);
  });
}

async function collectBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
