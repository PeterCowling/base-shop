import { getRouteKind } from "./routing";
import { getOrCreateRequestId, REQUEST_ID_HEADER } from "./requestId";

export interface Env {
  NODE_COMMERCE_ORIGIN?: string;
  NODE_COMMERCE_AUTH_HEADER?: string;
  FRONT_DOOR_AUTH_TOKEN?: string;
}

const SHOP_ID_HEADER = "x-shop-id";
const FRONT_DOOR_TOKEN_HEADER = "x-front-door-token";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withRequestId(res: Response, requestId: string): Response {
  const headers = new Headers(res.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function rewriteToOrigin(url: URL, origin: string): URL {
  const base = new URL(origin);
  const out = new URL(url.toString());
  out.protocol = base.protocol;
  out.host = base.host;
  if (base.pathname && base.pathname !== "/") {
    out.pathname = `${base.pathname.replace(/\/$/, "")}${out.pathname}`;
  }
  return out;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    const requestId = getOrCreateRequestId(request.headers);
    const kind = getRouteKind(url.pathname, request.method);
    if (!kind) {
      return withRequestId(json({ error: "Not found" }, 404), requestId); // i18n-exempt -- CGW-0001 [ttl=2026-12-31] machine response
    }

    if (kind === "shop") {
      const expected = typeof env.FRONT_DOOR_AUTH_TOKEN === "string" ? env.FRONT_DOOR_AUTH_TOKEN : "";
      if (expected) {
        const provided = request.headers.get(FRONT_DOOR_TOKEN_HEADER) ?? "";
        if (provided !== expected) {
          return withRequestId(json({ error: "Forbidden" }, 403), requestId); // i18n-exempt -- CGW-0001 [ttl=2026-12-31] machine response
        }
      }
    }

    const origin = typeof env.NODE_COMMERCE_ORIGIN === "string" ? env.NODE_COMMERCE_ORIGIN : "";
    if (!origin) {
      return withRequestId(json({ error: "NODE_COMMERCE_ORIGIN is not set" }, 502), requestId); // i18n-exempt -- CGW-0001 [ttl=2026-12-31] machine response
    }

    const headers = new Headers(request.headers);
    headers.set(REQUEST_ID_HEADER, requestId);
    headers.delete(FRONT_DOOR_TOKEN_HEADER);

    if (kind === "webhook") {
      headers.delete(SHOP_ID_HEADER);
    } else {
      const shopId = headers.get(SHOP_ID_HEADER);
      if (!shopId || !shopId.trim()) {
        return withRequestId(json({ error: "Missing shop context" }, 400), requestId); // i18n-exempt -- CGW-0001 [ttl=2026-12-31] machine response
      }
    }

    const authHeader = typeof env.NODE_COMMERCE_AUTH_HEADER === "string" ? env.NODE_COMMERCE_AUTH_HEADER : "";
    if (authHeader) headers.set("authorization", authHeader);

    const upstreamUrl = rewriteToOrigin(url, origin);
    const upstreamRequest = new Request(upstreamUrl.toString(), request);
    const withInjected = new Request(upstreamRequest, { headers });

    const res = await fetch(withInjected);
    return withRequestId(res, requestId);
  },
};

export default worker;
