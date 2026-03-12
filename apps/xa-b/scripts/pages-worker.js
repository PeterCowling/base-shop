const BASE_SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000",
};

const CSP_REPORTING_ENDPOINT = 'csp-endpoint="/csp-report"';
const CSP_REPORT_CONTENT_TYPES = new Set([
  "application/csp-report",
  "application/reports+json",
  "application/json",
]);

function randomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function applyBaseSecurityHeaders(headers) {
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
}

function buildCsp(nonce) {
  const connectSrc = ["'self'", "__XA_EXTRA_CONNECT_SRC__"].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "frame-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "img-src 'self' data: https://imagedelivery.net https://*.r2.dev",
    "font-src 'self' data:",
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    `connect-src ${connectSrc}`,
    "block-all-mixed-content",
    "upgrade-insecure-requests",
    "report-uri /csp-report",
    "report-to csp-endpoint",
  ].join("; ");
}

function isHtmlResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("text/html");
}

function cloneWithHeaders(response, headers) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

class InlineTagNonceRewriter {
  constructor(nonce) {
    this.nonce = nonce;
  }

  element(element) {
    if (element.tagName === "script") {
      if (element.hasAttribute("nonce")) return;
      const src = element.getAttribute("src");
      if (src && src.trim()) return;
      element.setAttribute("nonce", this.nonce);
      return;
    }
    if (element.tagName !== "style") return;
    if (element.hasAttribute("nonce")) return;
    element.setAttribute("nonce", this.nonce);
  }
}

function contentTypeOf(request) {
  return (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
}

async function handleCspReport(request) {
  if (request.method === "OPTIONS") {
    const headers = new Headers({
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    });
    applyBaseSecurityHeaders(headers);
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    const headers = new Headers({
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    });
    applyBaseSecurityHeaders(headers);
    return new Response(null, { status: 405, headers });
  }

  const contentType = contentTypeOf(request);
  if (contentType && !CSP_REPORT_CONTENT_TYPES.has(contentType)) {
    const headers = new Headers({ "Cache-Control": "no-store" });
    applyBaseSecurityHeaders(headers);
    return new Response(null, { status: 415, headers });
  }

  await request.arrayBuffer().catch(() => new ArrayBuffer(0));
  const headers = new Headers({ "Cache-Control": "no-store" });
  applyBaseSecurityHeaders(headers);
  return new Response(null, { status: 204, headers });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/csp-report") {
      return await handleCspReport(request);
    }

    const upstream = await env.ASSETS.fetch(request);
    const baseHeaders = new Headers(upstream.headers);
    applyBaseSecurityHeaders(baseHeaders);

    if (!isHtmlResponse(upstream)) {
      return cloneWithHeaders(upstream, baseHeaders);
    }

    const nonce = randomNonce();
    const transformed = new HTMLRewriter()
      .on("script", new InlineTagNonceRewriter(nonce))
      .on("style", new InlineTagNonceRewriter(nonce))
      .transform(upstream);

    const headers = new Headers(transformed.headers);
    applyBaseSecurityHeaders(headers);
    headers.set("Reporting-Endpoints", CSP_REPORTING_ENDPOINT);
    headers.set("Content-Security-Policy", buildCsp(nonce));

    return cloneWithHeaders(transformed, headers);
  },
};

export default worker;
