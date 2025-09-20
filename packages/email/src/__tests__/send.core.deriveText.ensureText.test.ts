import type { CampaignOptions } from "../send";

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

describe("send core – deriveText & ensureText", () => {
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

  it("cleans and normalizes HTML", async () => {
    const { deriveText } = await import("../send");
    const html =
      "<div>  Hello&nbsp;<strong>World</strong><style>.a{}</style><script>alert(1)</script>&amp; &lt;Test&gt; &#39;Quote&#39; \"Double\" </div>";
    expect(deriveText(html)).toBe("Hello World & <Test> 'Quote' \"Double\"");
  });

  it("throws when html is missing", async () => {
    const { ensureText } = await import("../send");
    expect(() => ensureText({ to: "a", subject: "s" } as any)).toThrow(
      "Missing html content for campaign email"
    );
  });

  it("returns original options when text exists", async () => {
    const { ensureText } = await import("../send");
    const opts: CampaignOptions = {
      to: "a",
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    };
    expect(ensureText(opts)).toBe(opts);
  });

  it("derives text when missing", async () => {
    const { ensureText } = await import("../send");
    const result = ensureText({
      to: "a",
      subject: "s",
      html: "<p>Hello</p>",
    });
    expect(result.text).toBe("Hello");
  });
});

