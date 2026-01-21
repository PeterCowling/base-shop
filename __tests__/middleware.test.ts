import type { NextRequest } from "next/server";

afterEach(() => {
  jest.resetModules();
  jest.dontMock("next-secure-headers");
});

describe("middleware security headers", () => {
  it("adds expected security headers and values", async () => {
    const { middleware } = await import("../middleware");
    const { createHeadersObject } = await import("next-secure-headers");
    const response = middleware({} as unknown as NextRequest);

    const expectedHeaders = [
      "Content-Security-Policy",
      "Cross-Origin-Embedder-Policy",
      "Cross-Origin-Opener-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "Referrer-Policy",
      "X-Content-Type-Options",
      "X-Download-Options",
    ];

    for (const header of expectedHeaders) {
      expect(response.headers.get(header)).not.toBeNull();
    }

    const expected = createHeadersObject({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: "'self'",
          baseURI: "'self'",
          objectSrc: "'none'",
          formAction: "'self'",
          frameAncestors: "'none'",
        },
      },
      forceHTTPSRedirect: [
        true,
        { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true },
      ],
      frameGuard: "deny",
      referrerPolicy: "no-referrer",
      nosniff: "nosniff",
      noopen: "noopen",
    });

    expect(response.headers.get("Content-Security-Policy")).toBe(
      expected["Content-Security-Policy"],
    );
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      expected["Strict-Transport-Security"],
    );
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });

  it("returns a response even if createHeadersObject fails", async () => {
    jest.doMock("next-secure-headers", () => ({
      createHeadersObject: () => {
        throw new Error("boom");
      },
    }));
    const { middleware } = await import("../middleware");
    const response = middleware({} as unknown as NextRequest);

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });
});
