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
  // Allow API route tests to hit local handlers without mocking
  rest.post("*/shop/:id/publish-upgrade", (req) => req.passthrough()),
];

export const server = setupServer(...handlers);

export { rest };
