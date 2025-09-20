import { server, rest } from "~test/msw/server";
import { handlers } from "./handlers";

// Extend the shared global server with CMS‑specific handlers for each test.
// The workspace's global jest.setup.ts manages start/stop and reset, so we
// simply re‑apply our app‑specific handlers before every test to ensure they
// persist across resets between tests.
beforeEach(() => server.use(...handlers));

export { rest };
