import { ProviderError } from "./providers/types";

let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;
let mockSanitizeHtml: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("./providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("./providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  delete process.env.EMAIL_PROVIDER;
  delete process.env.SENDGRID_API_KEY;
  delete process.env.RESEND_API_KEY;
});

describe("deriveText and ensureText", () => {
  it("generates plain text from HTML when text missing", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("./send");
    await sendCampaignEmail({
      to: "user@example.com",
      subject: "Hi",
      html: "<p>Hello <strong>world</strong></p>",
    });

    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Hello world" })
    );
  });

  it("throws when HTML content is missing", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("./send");
    await expect(
      sendCampaignEmail({ to: "user@example.com", subject: "No HTML" })
    ).rejects.toThrow("Missing html content for campaign email");
  });
});

describe("provider selection", () => {
  it("uses configured provider", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "rs";

    const { sendCampaignEmail } = await import("./send");
    await sendCampaignEmail({
      to: "user@example.com",
      subject: "Hi",
      html: "<p>Hello</p>",
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendgridSend).not.toHaveBeenCalled();
  });

  it("falls back to secondary provider on error", async () => {
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";

    const { sendCampaignEmail } = await import("./send");
    await sendCampaignEmail({
      to: "user@example.com",
      subject: "Hi",
      html: "<p>Hello</p>",
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });
});

describe("HTML sanitization", () => {
  it("sanitizes HTML when enabled", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn(() => "<p>clean</p>");

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("./send");
    await sendCampaignEmail({
      to: "user@example.com",
      subject: "Hi",
      html: "<img src=x onerror=alert(1)>",
    });

    expect(mockSanitizeHtml).toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>clean</p>" })
    );
  });

  it("skips sanitization when disabled", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn(() => "<p>clean</p>");

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("./send");
    await sendCampaignEmail({
      to: "user@example.com",
      subject: "Hi",
      html: "<div>dirty</div>",
      sanitize: false,
    });

    expect(mockSanitizeHtml).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<div>dirty</div>" })
    );
  });
});

describe("invalid provider", () => {
  it("throws descriptive error for unsupported provider", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn();

    process.env.EMAIL_PROVIDER = "unknown";
    await expect(import("./send")).rejects.toThrow(
      'Unsupported EMAIL_PROVIDER "unknown". Available providers: sendgrid, resend, smtp'
    );
  });
});

