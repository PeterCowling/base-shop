export function setupMocks() {
  jest.resetModules();
  process.env.CART_COOKIE_SECRET = "secret";
  const trackEvent = jest.fn();
  jest.doMock("@platform-core/analytics", () => ({
    __esModule: true,
    trackEvent,
  }));
  jest.doMock("../providers/sendgrid", () => ({
    SendgridProvider: jest.fn(),
  }));
  jest.doMock("../providers/resend", () => ({
    ResendProvider: jest.fn(),
  }));
  return { trackEvent };
}
