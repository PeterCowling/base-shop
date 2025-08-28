import { rest } from "msw";
import { setupServer } from "msw/node";

/**
 * Global MSW server to intercept network requests in tests.
 * Handlers can be added in individual tests via `server.use(...)`.
 */
const handlers = [
  rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
  ),
  rest.put("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
  rest.patch("/cms/api/wizard-progress", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),
];

export const server = setupServer(...handlers);

export { rest };
