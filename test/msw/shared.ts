/* istanbul ignore file */
// test/msw/shared.ts
//--------------------------------------------------
// Shared MSW utilities: default handlers + server factory
//--------------------------------------------------
import { rest } from "msw";
import type { RestHandler } from "msw";
import { setupServer } from "msw/node";

/**
 * Default, workspace‑wide request handlers used by most tests.
 * Individual suites can compose or override these by creating a
 * server via `createServer(...extraHandlers)` or using
 * `server.use(...extraHandlers)` at runtime.
 */
export const defaultHandlers: RestHandler[] = [
  // RBAC users list used by Comments mention feature
  // Accepts GET to `/cms/api/rbac/users` and returns a small stable set
  // of emails. The hook also supports a bare array, but an object with
  // `users` mirrors typical API shape while remaining harmless.
  rest.get("/cms/api/rbac/users", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ users: [
      "me@example.com",
      "alice@example.com",
      "bob@example.com",
    ] }))
  ),
  // Healthy default endpoints for CMS configurator flows
  rest.post("/cms/api/configurator", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, message: "default handler: OK" }))
  ),
  rest.get("/cms/api/configurator/validate-env/:shop", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true }))
  ),
  rest.get("/cms/api/page-templates", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json([]))
  ),
  rest.get("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
  ),
  rest.put("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.patch("/cms/api/configurator-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.post("/cms/api/launch-shop", async (req, res, ctx) => {
    const body = await req.json().catch(() => ({} as any));
    const seed = Boolean((body as any)?.seed);
    const steps = [
      { step: "create", status: "success" },
      { step: "init", status: "success" },
      ...(seed ? [{ step: "seed", status: "success" }] : []),
      { step: "deploy", status: "success" },
    ];
    const stream = new ReadableStream({
      start(controller) {
        steps.forEach((s) => controller.enqueue(`data: ${JSON.stringify(s)}\n\n`));
        controller.close();
      },
    });
    return res(
      ctx.status(200),
      ctx.set("Content-Type", "text/event-stream"),
      ctx.body(stream)
    );
  }),
  rest.get("/api/publish-locations", (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json([
        {
          id: "homepage-hero",
          name: "Homepage hero",
          path: "homepage/hero",
          requiredOrientation: "landscape",
        },
      ])
    )
  ),
  // Allow cart API requests to reach fetch mocks or the real network.
  // Using relative paths ensures requests like `/api/cart` are matched.
  rest.get("/api/cart", (req) => req.passthrough()),
  rest.post("/api/cart", (req) => req.passthrough()),
  rest.put("/api/cart", (req) => req.passthrough()),
  rest.patch("/api/cart", (req) => req.passthrough()),
  rest.delete("/api/cart", (req) => req.passthrough()),

  // Page Builder: presets and sections feeds
  rest.get("/api/sections/:shop/presets", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json([]))
  ),
  rest.get("/cms/api/sections/:shop", (req, res, ctx) => {
    // Supports `?page=1&pageSize=500`; return minimal list shape
    const items: any[] = [];
    return res(ctx.status(200), ctx.json({ items }));
  }),

  // Page Builder library endpoints (server-backed best-effort)
  rest.get("/api/library", (_req, res, ctx) => res(ctx.status(200), ctx.json([]))),
  rest.post("/api/library", (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
  rest.patch("/api/library", (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
  rest.delete("/api/library", (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
  // Allow API route tests to hit local handlers without mocking
  // Supertest spins up an ephemeral HTTP server on 127.0.0.1; MSW intercepts
  // those requests unless explicitly bypassed. Let requests to the API routes
  // under test pass through so the real handlers execute.
  rest.get("*/components/:shopId", (req) => req.passthrough()),
  rest.post("*/shop/:id/publish-upgrade", (req) => req.passthrough()),
];

/**
 * Create an MSW server that layers `extraHandlers` on top of the
 * shared `defaultHandlers`. If handlers overlap, the last matching
 * handler wins, allowing fine‑grained per‑suite overrides.
 */
export function createServer(
  ...extraHandlers: RestHandler[]
) {
  return setupServer(...defaultHandlers, ...extraHandlers);
}

export { rest };
