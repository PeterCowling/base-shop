// Allow disabling MSW for suites that don't need it or to work around
// environment transform issues. When DISABLE_MSW=1, this setup becomes a no-op.
let rest: any;

if (process.env.DISABLE_MSW !== "1") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const shared = require("~test/msw/server");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { handlers } = require("./handlers");
  const server = shared.server;
  rest = shared.rest;

  // Extend the shared global server with CMS‑specific handlers for each test.
  // The workspace's global jest.setup.ts manages start/stop and reset, so we
  // simply re‑apply our app‑specific handlers before every test to ensure they
  // persist across resets between tests.
  beforeEach(() => server.use(...handlers));
}

export { rest };
