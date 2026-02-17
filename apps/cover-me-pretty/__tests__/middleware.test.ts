/**
 * @jest-environment node
 */
// apps/cover-me-pretty/__tests__/middleware.test.ts
import { middleware } from "../middleware";

type MiddlewareRequest = Parameters<typeof middleware>[0];

function createRequest(
  path: string,
  cookies: Record<string, string> = {}
): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  } as unknown as MiddlewareRequest;
}

describe("middleware", () => {
  it("allows valid locale paths", async () => {
    const res = await middleware(createRequest("/en/products"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects invalid paths to /en", async () => {
    const res = await middleware(createRequest("/fr/foo"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/en");
  });

  it("skips static and Next internals", async () => {
    const res1 = await middleware(createRequest("/_next/static/file.js"));
    const res2 = await middleware(createRequest("/styles.css"));
    expect(res1.headers.get("x-middleware-next")).toBe("1");
    expect(res2.headers.get("x-middleware-next")).toBe("1");
  });

  it("sets a deterministic sha256 CSP hash for GA4 inline script", async () => {
    const savedId = process.env.NEXT_PUBLIC_GA4_ID;
    process.env.NEXT_PUBLIC_GA4_ID = "G-TEST123";
    try {
      const req = createRequest("/en/products", { "consent.analytics": "true" });
      const res = await middleware(req);
      const csp = res.headers.get("content-security-policy");
      expect(csp).not.toBeNull();
      // Should contain a sha256 hash for the inline script
      expect(csp).toMatch(/'sha256-[A-Za-z0-9+/]+=*'/);
      // Should be deterministic: calling again gives identical CSP
      const res2 = await middleware(req);
      expect(res2.headers.get("content-security-policy")).toBe(csp);
    } finally {
      if (savedId === undefined) delete process.env.NEXT_PUBLIC_GA4_ID;
      else process.env.NEXT_PUBLIC_GA4_ID = savedId;
    }
  });
});
