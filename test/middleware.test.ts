import { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("middleware security headers", () => {
  it("sets cross-origin and permissions policy headers", () => {
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
  });
});
