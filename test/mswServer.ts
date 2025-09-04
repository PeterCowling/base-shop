import { rest } from "msw";
import { setupServer } from "msw/node";

/**
 * Global MSW server to intercept network requests in tests.
 * Handlers can be added in individual tests via `server.use(...)`.
 */
const handlers = [
  rest.post("/cms/api/configurator", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true, message: "default handler: OK" }))
  ),
  rest.get("/cms/api/configurator/validate-env/:shop", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ success: true }))
  ),
  rest.get("/cms/api/page-templates", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json([]))
  ),
];

export const server = setupServer(...handlers);

export { rest };
