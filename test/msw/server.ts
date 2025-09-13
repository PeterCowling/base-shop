/* istanbul ignore file */
// tests/msw/server.ts
//--------------------------------------------------
// Shared Mock Service Worker server
//--------------------------------------------------
import { rest } from "msw";
import { setupServer } from "msw/node";

/**
 * Define *global* request handlers that should be active
 * for every test file.  You can also `.use()` additional
 * handlers inside individual tests when you need to
 * override the default behaviour.
 */
export const handlers = [
  // ⬇️  Example “healthy” default; override as required in tests
  rest.post("/cms/api/configurator", (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({ success: true, message: "default handler: OK" })
    )
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
    const body = await req.json();
    const seed = Boolean(body?.seed);
    const steps = [
      { step: "create", status: "success" },
      { step: "init", status: "success" },
      ...(seed ? [{ step: "seed", status: "success" }] : []),
      { step: "deploy", status: "success" },
    ];
    const stream = new ReadableStream({
      start(controller) {
        steps.forEach((s) =>
          controller.enqueue(`data: ${JSON.stringify(s)}\n\n`)
        );
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
  //
  // Using relative paths here ensures requests like `/api/cart` – which the
  // tests issue – are matched correctly.  The previous patterns prefixed with
  // `*/` failed to match and resulted in MSW treating the calls as unhandled,
  // causing the CartContext tests to blow up.  By explicitly registering the
  // relative `/api/cart` routes we let the requests passthrough to any fetch
  // mocks without triggering MSW's `onUnhandledRequest` errors.
  rest.get("/api/cart", (req) => req.passthrough()),
  rest.post("/api/cart", (req) => req.passthrough()),
  rest.put("/api/cart", (req) => req.passthrough()),
  rest.patch("/api/cart", (req) => req.passthrough()),
  rest.delete("/api/cart", (req) => req.passthrough()),
  // Allow API route tests to hit local handlers without mocking
  rest.post("*/shop/:id/publish-upgrade", (req) => req.passthrough()),
];

export const server = setupServer(...handlers);

export { rest };
