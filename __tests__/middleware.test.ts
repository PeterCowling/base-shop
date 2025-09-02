import type { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("middleware security headers", () => {
  it("adds expected security headers", () => {
    const mockRequest = {} as NextRequest;
    const response = middleware(mockRequest);

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
  });
});
