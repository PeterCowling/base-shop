/* istanbul ignore file */
// test/msw/flows.ts
//--------------------------------------------------
// Reusable MSW handler sets for common flows
//--------------------------------------------------
import type { HttpHandler } from "msw";
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
    rest.get("/api/auth/csrf", (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ csrfToken: "test-csrf-token" }));
    }),

    // Credentials callback sets a signed session cookie the app will accept
    rest.post("/api/auth/callback/credentials", async (req, res, ctx) => {
      const token = jwt.sign({ role }, secret);
      // Align with NextAuth cookie name used in tests
      const cookie = `next-auth.session-token=${token}; Path=/; HttpOnly`;
      return res(
        ctx.status(200),
        ctx.set('Set-Cookie', cookie),
        ctx.json({ ok: true, role })
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
    rest.post("/api/checkout-session", async (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ clientSecret: "cs_test", sessionId: "sess_test" })
      );
    }),
  ];
}

export { rest };
