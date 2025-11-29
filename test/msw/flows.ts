/* istanbul ignore file */
// test/msw/flows.ts
//--------------------------------------------------
// Reusable MSW handler sets for common flows
//--------------------------------------------------
import type { HttpHandler } from "msw";
import { HttpResponse } from "msw";
import { rest } from "./shared";
import jwt from "jsonwebtoken";

const DEFAULT_SECRET = process.env.NEXTAUTH_SECRET || "test-nextauth-secret-32-chars-long-string!";

/**
 * Simulate a successful credentials login by stubbing next-auth endpoints
 * and setting a valid JWT session cookie for the requested role.
 */
export function handlersLoginAs(role: "admin" | "viewer" | string = "admin", opts?: { secret?: string }): HttpHandler[] {
  const secret = opts?.secret || DEFAULT_SECRET;
  return [
    // Minimal CSRF token so apps that request it can proceed
    rest.get("/api/auth/csrf", ({ request }) => {
      try {
        const url = new URL(request.url);
         
        console.log("[msw:loginAs] CSRF token issued", { role, path: url.pathname });
      } catch {
         
        console.log("[msw:loginAs] CSRF token issued", { role });
      }
      return HttpResponse.json({ csrfToken: "test-csrf-token" });
    }),

    // Credentials callback sets a signed session cookie the app will accept
    rest.post("/api/auth/callback/credentials", async ({ request }) => {
      try {
        const url = new URL(request.url);
         
        console.log("[msw:loginAs] credentials callback hit", { role, path: url.pathname });
      } catch {
         
        console.log("[msw:loginAs] credentials callback hit", { role });
      }
      const token = jwt.sign({ role }, secret);
      // Align with NextAuth cookie name used in tests
      const cookie = `next-auth.session-token=${token}; Path=/; HttpOnly`;
      return HttpResponse.json(
        { ok: true, role },
        {
          headers: {
            "Set-Cookie": cookie,
          },
        },
      );
    }),
  ];
}

/**
 * Deterministic happy path for checkout session creation so tests
 * don't need to wire cy.intercept in every spec.
 */
export function handlersCheckoutHappyPath(): HttpHandler[] {
  return [
    rest.post("/api/checkout-session", () => {
      return HttpResponse.json({ clientSecret: "cs_test", sessionId: "sess_test" });
    }),
  ];
}

export { rest };
