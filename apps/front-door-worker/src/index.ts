import { resolveHostMapping } from "./hostMapping";
import {
  addLocalePrefix,
  getRouteTarget,
  hasLocalePrefix,
  shouldBypassLocalePrefix,
} from "./routing";
import { getOrCreateRequestId, REQUEST_ID_HEADER } from "./requestId";
import { handleControlPlane } from "./controlPlane";

export interface Env {
  HOST_MAPPING_JSON?: string;
  GATEWAY_ORIGIN?: string;
  GATEWAY_AUTH_TOKEN?: string;
  CONTROL_PLANE_TOKEN?: string;
  HOST_MAPPING_CACHE?: KVNamespace;
  ROUTING_DB?: D1Database;
}

const SHOP_ID_HEADER = "x-shop-id";
const FRONT_DOOR_TOKEN_HEADER = "x-front-door-token";

function withHeader(res: Response, name: string, value: string): Response {
  const headers = new Headers(res.headers);
  headers.set(name, value);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function redirect(to: string, status: number): Response {
  return new Response(null, { status, headers: { Location: to } });
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const maybeInternal = await handleControlPlane(request, env);
    if (maybeInternal) return maybeInternal;

    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const requestId = getOrCreateRequestId(request.headers);

    const mapping = await resolveHostMapping(host, env, ctx);
    if (!mapping) {
      return withHeader(new Response("not found", { status: 404 }), REQUEST_ID_HEADER, requestId); // i18n-exempt -- machine response
    }

    if (mapping.mode === "redirect-only") {
      const targetHost = mapping.redirectTo ?? mapping.canonicalHost;
      const to = new URL(request.url);
      to.host = targetHost;
      const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
      return withHeader(redirect(to.toString(), status), REQUEST_ID_HEADER, requestId);
    }

    if (mapping.mode === "expired") {
      return withHeader(new Response("gone", { status: 410 }), REQUEST_ID_HEADER, requestId); // i18n-exempt -- machine response
    }

    if (host !== mapping.canonicalHost) {
      const to = new URL(request.url);
      to.host = mapping.canonicalHost;
      const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
      return withHeader(redirect(to.toString(), status), REQUEST_ID_HEADER, requestId);
    }

    const target = getRouteTarget(url.pathname, request.method);
    if (target === "deny") {
      return withHeader(new Response("not found", { status: 404 }), REQUEST_ID_HEADER, requestId); // i18n-exempt -- machine response
    }

    if (!shouldBypassLocalePrefix(url.pathname) && !hasLocalePrefix(url.pathname)) {
      const to = new URL(request.url);
      to.pathname = addLocalePrefix(url.pathname, mapping.defaultLocale);
      return withHeader(redirect(to.toString(), 307), REQUEST_ID_HEADER, requestId);
    }

    const headers = new Headers(request.headers);
    headers.delete(SHOP_ID_HEADER);
    headers.delete(FRONT_DOOR_TOKEN_HEADER);
    headers.set(SHOP_ID_HEADER, mapping.shopId);
    headers.set(REQUEST_ID_HEADER, requestId);

    const upstreamUrl =
      target === "gateway"
        ? (() => {
            const origin = typeof env.GATEWAY_ORIGIN === "string" ? env.GATEWAY_ORIGIN : "";
            if (!origin) return null;
            return rewriteToOrigin(url, origin);
          })()
        : url;

    if (!upstreamUrl) {
      return withHeader(new Response("bad gateway", { status: 502 }), REQUEST_ID_HEADER, requestId); // i18n-exempt -- machine response
    }

    if (target === "gateway") {
      const token = typeof env.GATEWAY_AUTH_TOKEN === "string" ? env.GATEWAY_AUTH_TOKEN : "";
      if (token) headers.set(FRONT_DOOR_TOKEN_HEADER, token);
    }

    const upstreamRequest = new Request(upstreamUrl.toString(), request);
    const withInjected = new Request(upstreamRequest, { headers });

    const res = await fetch(withInjected);
    return withHeader(res, REQUEST_ID_HEADER, requestId);
  },
};

export default worker;
