import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

describe("middleware security headers", () => {
  it("sets expected security headers", () => {
    const request = new NextRequest("http://example.com");
    const response = middleware(request);

    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe(
      "same-origin",
    );
    expect(response.headers.get("Cross-Origin-Embedder-Policy")).toBe(
      "require-corp",
    );
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );
    expect(response.headers.get("X-Frame-Options")).toBe("deny");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Download-Options")).toBe("noopen");
  });
});
