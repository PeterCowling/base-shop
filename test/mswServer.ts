import { rest } from "msw";
import { setupServer } from "msw/node";

/**
 * Global MSW server to intercept network requests in tests.
 * Handlers can be added in individual tests via `server.use(...)`.
 */
export const server = setupServer();

export { rest };
