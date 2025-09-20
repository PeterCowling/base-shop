// Mock implementations will be configured per-test via the variables below.
let mockRenderTemplate: jest.Mock;
let mockSanitizeHtml: jest.Mock;
let mockHasProviderErrorFields: jest.Mock;
let mockCreateTransport: jest.Mock;
let mockSendMail: jest.Mock;
let mockGetDefaultSender: jest.Mock;

const mockSendgridImport = jest.fn();
const mockResendImport = jest.fn();
const SendgridProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));
const ResendProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));

jest.mock("../providers/sendgrid", () => {
  mockSendgridImport();
  return { SendgridProvider };
});

jest.mock("../providers/resend", () => {
  mockResendImport();
  return { ResendProvider };
});

jest.mock("../templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("../providers/error", () => ({
  hasProviderErrorFields: (...args: any[]) =>
    mockHasProviderErrorFields(...args),
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: (...args: any[]) => mockCreateTransport(...args),
  },
}));

jest.mock("../config", () => ({
  getDefaultSender: (...args: any[]) => mockGetDefaultSender(...args),
}));

describe("send core – sendWithRetry", () => {
  beforeEach(() => {
    mockRenderTemplate = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);
    mockHasProviderErrorFields = jest.fn().mockReturnValue(true);
    mockSendMail = jest.fn();
    mockCreateTransport = jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    }));
    mockGetDefaultSender = jest.fn(() => "from@example.com");
    SendgridProvider.mockClear();
    ResendProvider.mockClear();
    mockSendgridImport.mockClear();
    mockResendImport.mockClear();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
  });

  it("applies exponential backoff for retryable ProviderError", async () => {
    jest.useFakeTimers();
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const { sendWithRetry } = await import("../send");
    const { ProviderError } = await import("../providers/types");
    const provider = {
      send: jest.fn().mockRejectedValue(new ProviderError("x", true)),
    };
    const promise = sendWithRetry(
      provider as any,
      { to: "t@example.com", subject: "s" },
      4
    ).catch(() => {});
    await jest.runAllTimersAsync();
    await promise;
    expect(provider.send).toHaveBeenCalledTimes(4);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(timeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 400);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it("retries when error object has retryable property", async () => {
    jest.useFakeTimers();
    mockHasProviderErrorFields.mockReturnValue(true);
    const { sendWithRetry } = await import("../send");
    const err = { retryable: true };
    const provider = { send: jest.fn().mockRejectedValue(err) };
    const promise = sendWithRetry(provider as any, {
      to: "t@example.com",
      subject: "s",
    }).catch(() => {});
    await jest.runAllTimersAsync();
    await promise;
    expect(provider.send).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it("does not retry when error object has retryable false", async () => {
    const { sendWithRetry } = await import("../send");
    const err = { retryable: false };
    const provider = { send: jest.fn().mockRejectedValue(err) };
    await expect(
      sendWithRetry(provider as any, { to: "t@example.com", subject: "s" })
    ).rejects.toBe(err);
    expect(provider.send).toHaveBeenCalledTimes(1);
  });

  it("retries up to default limit when provider rejects with empty object", async () => {
    jest.useFakeTimers();
    mockHasProviderErrorFields.mockReturnValue(true);
    const { sendWithRetry } = await import("../send");
    const err = {};
    const provider = { send: jest.fn().mockRejectedValue(err) };
    const expectation = expect(
      sendWithRetry(provider as any, { to: "t@example.com", subject: "s" })
    ).rejects.toBe(err);
    await jest.runAllTimersAsync();
    await expectation;
    expect(provider.send).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it("retries when error lacks retryable flag", async () => {
    jest.useFakeTimers();
    mockHasProviderErrorFields.mockReturnValue(false);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { sendWithRetry } = await import("../send");
    const error = new Error("x");
    const provider = { send: jest.fn().mockRejectedValue(error) };
    const promise = sendWithRetry(provider as any, {
      to: "t@example.com",
      subject: "s",
    }).catch(() => {});
    await jest.runAllTimersAsync();
    await promise;
    expect(provider.send).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledWith("Unrecognized provider error", {
      error,
    });
    warn.mockRestore();
    jest.useRealTimers();
  });

  it("throws immediately on non-retryable error", async () => {
    const { sendWithRetry } = await import("../send");
    const { ProviderError } = await import("../providers/types");
    const provider = {
      send: jest.fn().mockRejectedValue(new ProviderError("x", false)),
    };
    await expect(
      sendWithRetry(provider as any, { to: "t@example.com", subject: "s" })
    ).rejects.toBeInstanceOf(ProviderError);
    expect(provider.send).toHaveBeenCalledTimes(1);
  });
});

