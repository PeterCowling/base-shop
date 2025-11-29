/* istanbul ignore file */
// test/msw/shared.ts
//--------------------------------------------------
// Shared MSW utilities: default handlers + server factory
//--------------------------------------------------
import { http, HttpResponse, passthrough } from "msw";
import type { HttpHandler } from "msw";
import { setupServer } from "msw/node";
import type { SetupServerApi } from "msw/node";

export const rest = http;

/**
 * Default, workspace‑wide request handlers used by most tests.
 * Individual suites can compose or override these by creating a
 * server via `createServer(...extraHandlers)` or using
 * `server.use(...extraHandlers)` at runtime.
 */
export const defaultHandlers: HttpHandler[] = [
  // RBAC users list used by Comments mention feature
  // Accepts GET to `/cms/api/rbac/users` and returns a small stable set
  // of emails. The hook also supports a bare array, but an object with
  // `users` mirrors typical API shape while remaining harmless.
  rest.get("/cms/api/rbac/users", () =>
    HttpResponse.json({
      users: ["me@example.com", "alice@example.com", "bob@example.com"],
    }),
  ),
  // Healthy default endpoints for CMS configurator flows
  rest.post("/cms/api/configurator", () =>
    HttpResponse.json({ success: true, message: "default handler: OK" }),
  ),
  rest.get("/cms/api/configurator/validate-env/:shop", () =>
    HttpResponse.json({ success: true }),
  ),
  rest.get("/cms/api/page-templates", () => HttpResponse.json([])),
  rest.get("/cms/api/configurator-progress", () =>
    HttpResponse.json({ state: {}, completed: {} }),
  ),
  rest.put("/cms/api/configurator-progress", () => HttpResponse.json({})),
  rest.patch("/cms/api/configurator-progress", () => HttpResponse.json({})),
  rest.post("/cms/api/launch-shop", async ({ request }) => {
    type LaunchShopBody = { seed?: boolean };
    let body: Partial<LaunchShopBody> = {};
    try {
      body = (await request.json()) as Partial<LaunchShopBody>;
    } catch {
      body = {};
    }
    const seed = Boolean(body.seed);
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
    return new HttpResponse(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
  rest.get("/api/publish-locations", () =>
    HttpResponse.json([
      {
        id: "homepage-hero",
        name: "Homepage hero",
        path: "homepage/hero",
        requiredOrientation: "landscape",
      },
    ]),
  ),
  // Allow cart API requests to reach fetch mocks or the real network.
  // Using relative paths ensures requests like `/api/cart` are matched.
  rest.get("/api/cart", () => passthrough()),
  rest.post("/api/cart", () => passthrough()),
  rest.put("/api/cart", () => passthrough()),
  rest.patch("/api/cart", () => passthrough()),
  rest.delete("/api/cart", () => passthrough()),

  // Page Builder: presets and sections feeds
  rest.get("/api/sections/:shop/presets", () => HttpResponse.json([])),
  rest.get("/cms/api/sections/:shop", () => {
    // Supports `?page=1&pageSize=500`; return minimal list shape
    const items: Array<Record<string, unknown>> = [];
    return HttpResponse.json({ items });
  }),

  // Page Builder library endpoints (server-backed best-effort)
  rest.get("/api/library", () => HttpResponse.json([])),
  rest.post("/api/library", () => HttpResponse.json({ ok: true })),
  rest.patch("/api/library", () => HttpResponse.json({ ok: true })),
  rest.delete("/api/library", () => HttpResponse.json({ ok: true })),
  // Allow API route tests to hit local handlers without mocking
  // Supertest spins up an ephemeral HTTP server on 127.0.0.1; MSW intercepts
  // those requests unless explicitly bypassed. Let requests to the API routes
  // under test pass through so the real handlers execute.
  rest.get("*/components/:shopId", () => passthrough()),
  rest.post("*/shop/:id/publish-upgrade", () => passthrough()),
];

/**
 * Create an MSW server that layers `extraHandlers` on top of the
 * shared `defaultHandlers`. If handlers overlap, the last matching
 * handler wins, allowing fine‑grained per‑suite overrides.
 */
export function createServer(
  ...extraHandlers: HttpHandler[]
): SetupServerApi {
  return setupServer(...defaultHandlers, ...extraHandlers);
}
