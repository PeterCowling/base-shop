// Utilities and mocks shared across sendCampaignEmail tests

// Prefix mock variables with `mock` so Jest's hoisted `jest.mock`
// factory functions can safely reference them.
export let mockSendgridSend: jest.Mock;
export let mockResendSend: jest.Mock;
export let mockSendMail: jest.Mock;
export let mockSanitizeHtml: jest.Mock;
export let mockHasProviderErrorFields: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      // Forward calls to the test-controlled mock implementation.
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

jest.mock("../providers/error", () => ({
  hasProviderErrorFields: (...args: any[]) =>
    mockHasProviderErrorFields(...args),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("../scheduler", () => ({}));
jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));
// The templates module imports `@acme/email-templates`. Stub the module to
// avoid loading the real package and its dependencies in this test environment.
jest.mock("@acme/email-templates", () => ({ marketingEmailTemplates: [] }));

export const resetMocks = () => {
  mockSendgridSend = jest.fn();
  mockResendSend = jest.fn();
  mockSendMail = jest.fn();
  mockSanitizeHtml = jest.fn();
  mockHasProviderErrorFields = jest.fn();
};

export const setupEnv = () => {
  process.env.EMAIL_PROVIDER = "sendgrid";
  process.env.SENDGRID_API_KEY = "sg";
  process.env.RESEND_API_KEY = "rs";
  process.env.CAMPAIGN_FROM = "campaign@example.com";
};

export const cleanupEnv = () => {
  delete process.env.EMAIL_PROVIDER;
  delete process.env.SENDGRID_API_KEY;
  delete process.env.SENDGRID_MARKETING_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.CAMPAIGN_FROM;
};

