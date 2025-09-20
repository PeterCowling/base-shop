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

describe("send core – sendWithNodemailer", () => {
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

  it("creates transport with undefined SMTP_URL", async () => {
    delete process.env.SMTP_URL;
    const { sendWithNodemailer } = await import("../send");
    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Sub",
      html: "<p>H</p>",
      text: "T",
    });
    expect(mockCreateTransport).toHaveBeenCalledWith({ url: undefined });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Sub",
      html: "<p>H</p>",
      text: "T",
    });
  });

  it("creates transport with SMTP_URL and forwards fields", async () => {
    process.env.SMTP_URL = "smtp://test";
    const { sendWithNodemailer } = await import("../send");
    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Sub",
      html: "<p>H</p>",
      text: "T",
    });
    expect(mockCreateTransport).toHaveBeenCalledWith({ url: "smtp://test" });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Sub",
      html: "<p>H</p>",
      text: "T",
    });
  });

  it("surfaces sendMail rejections", async () => {
    process.env.SMTP_URL = "smtp://test";
    const err = new Error("smtp fail");
    mockSendMail.mockRejectedValue(err);
    const { sendWithNodemailer } = await import("../send");
    await expect(
      sendWithNodemailer({
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      })
    ).rejects.toThrow("smtp fail");
    expect(mockCreateTransport).toHaveBeenCalledWith({ url: "smtp://test" });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Sub",
      html: "<p>H</p>",
      text: "T",
    });
  });

  it("surfaces getDefaultSender errors", async () => {
    process.env.SMTP_URL = "smtp://test";
    const err = new Error("sender fail");
    mockGetDefaultSender.mockImplementation(() => {
      throw err;
    });
    const { sendWithNodemailer } = await import("../send");
    await expect(
      sendWithNodemailer({
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      })
    ).rejects.toThrow("sender fail");
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

