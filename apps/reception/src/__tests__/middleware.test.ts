import { NextRequest } from "next/server";

import { middleware } from "../middleware";

const originalAlloggiatiUrl = process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL;

function getCspFor(url: string): string {
  const request = new NextRequest(url);
  const response = middleware(request);
  const csp = response.headers.get("Content-Security-Policy");
  expect(csp).not.toBeNull();
  return csp ?? "";
}

describe("reception middleware security headers", () => {
  afterEach(() => {
    if (originalAlloggiatiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL;
      return;
    }

    process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL = originalAlloggiatiUrl;
  });

  it("sets a tight baseline CSP and transport headers for production hosts", () => {
    delete process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL;

    const request = new NextRequest("https://reception.hostel-positano.com/bar");
    const response = middleware(request);
    const csp = response.headers.get("Content-Security-Policy") ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("script-src-elem 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://script.googleusercontent.com");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("connect-src 'self' https://cloudflareinsights.com");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain(" https:;");

    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(response.headers.get("Cross-Origin-Embedder-Policy")).toBe("unsafe-none");
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Download-Options")).toBe("noopen");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );
  });

  it("allows only the configured Alloggiati script origin", () => {
    process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL =
      "https://script.google.com/macros/s/example-script/exec";

    const csp = getCspFor("https://reception.hostel-positano.com/bar");

    expect(csp).toContain("https://script.google.com");
    expect(csp).toContain("https://script.googleusercontent.com");
    // Verify no blanket https: scheme (bare "https:" without a domain would allow all HTTPS scripts)
    expect(csp).not.toMatch(/script-src-elem[^;]*\shttps:(?!\/)/);
  });

  it("omits HSTS on localhost", () => {
    const request = new NextRequest("http://localhost:3020/bar");
    const response = middleware(request);

    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
  });
});
