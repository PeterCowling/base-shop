export function createSendgridTestHarness() {
  const realFetch = global.fetch;

  let sgMail: any;

  beforeEach(() => {
    sgMail = require("@sendgrid/mail").default;
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.CAMPAIGN_FROM;
    global.fetch = realFetch;
  });

  return () => sgMail;
}
