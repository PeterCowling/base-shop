// apps/cover-me-pretty/__tests__/middleware.test.ts
import { middleware } from "../middleware";

type MiddlewareRequest = Parameters<typeof middleware>[0];

function createRequest(path: string): MiddlewareRequest {
  const url = new URL(`http://localhost${path}`) as URL & { clone(): URL };
  url.clone = () => new URL(url.toString());
  return { nextUrl: url, url: url.toString() } as unknown as MiddlewareRequest;
}

describe("middleware", () => {
  it("allows valid locale paths", () => {
    const res = middleware(createRequest("/en/products"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects invalid paths to /en", () => {
    const res = middleware(createRequest("/fr/foo"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/en");
  });

  it("skips static and Next internals", () => {
    const res1 = middleware(createRequest("/_next/static/file.js"));
    const res2 = middleware(createRequest("/styles.css"));
    expect(res1.headers.get("x-middleware-next")).toBe("1");
    expect(res2.headers.get("x-middleware-next")).toBe("1");
  });
});
