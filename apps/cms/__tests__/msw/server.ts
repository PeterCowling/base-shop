import { server, rest } from "../../../../test/msw/server";
import { handlers } from "./handlers";

// Extend the shared global server with CMS‑specific handlers.
// Do not start/stop another server instance here to avoid conflicts;
// the workspace's global jest.setup.ts manages lifecycle.
beforeAll(() => server.use(...handlers));
afterEach(() => server.resetHandlers());

export { rest };
