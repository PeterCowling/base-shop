import { ProviderError } from "../src/providers/types";
import {
  deriveText,
  ensureText,
  sendWithNodemailer,
  sendWithRetry,
} from "../src/send";

describe("deriveText", () => {
  it("strips tags, decodes entities and trims", () => {
    const html =
      '<style>p{}</style><script>alert(1)</script> Hello&nbsp;&amp;&lt;b&gt;world&lt;/b&gt; &#39;quote&#39; &quot;text&quot;  ';
    expect(deriveText(html)).toBe(
      "Hello &<b>world</b> 'quote' \"text\""
    );
  });
});

describe("ensureText", () => {
  it("throws when html missing", () => {
    expect(() => ensureText({ to: "a", subject: "b" } as any)).toThrow(
      "Missing html content for campaign email"
    );
  });

  it("returns unchanged when text provided", () => {
    const opts = ensureText({
      to: "a",
      subject: "b",
      html: "<p>c</p>",
      text: "provided",
    });
    expect(opts.text).toBe("provided");
  });

  it("derives text when absent", () => {
    const opts = ensureText({ to: "a", subject: "b", html: "<p>Hi</p>" });
    expect(opts.text).toBe("Hi");
  });
});

describe("loadProvider", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("returns undefined without API keys", async () => {
    const { loadProvider } = await import("../src/send");
    const provider = await loadProvider("sendgrid");
    expect(provider).toBeUndefined();
    const { SendgridProvider } = await import("../src/providers/sendgrid");
    expect(SendgridProvider).not.toHaveBeenCalled();
  });

  it("instantiates provider when key present and caches", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const { loadProvider } = await import("../src/send");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    const { SendgridProvider } = await import("../src/providers/sendgrid");
    expect(SendgridProvider).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("handles resend provider", async () => {
    process.env.RESEND_API_KEY = "rs";
    const { loadProvider } = await import("../src/send");
    const provider = await loadProvider("resend");
    const { ResendProvider } = await import("../src/providers/resend");
    expect(ResendProvider).toHaveBeenCalledTimes(1);
    expect(provider).toBeDefined();
  });

  it("returns undefined for unknown provider", async () => {
    const { loadProvider } = await import("../src/send");
    const provider = await loadProvider("unknown");
    expect(provider).toBeUndefined();
  });
});

let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;
let mockRenderTemplate: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("../src/providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("../src/providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

jest.mock("../src/templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

describe("sendCampaignEmail", () => {
  beforeEach(() => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockRenderTemplate = jest.fn();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("renders template when templateId provided", async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    mockRenderTemplate.mockReturnValue("<p>Tmpl</p>");
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    const { sendCampaignEmail } = await import("../src/send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Sub",
      templateId: "welcome",
      variables: { name: "Test" },
    });
    expect(mockRenderTemplate).toHaveBeenCalledWith("welcome", { name: "Test" });
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>Tmpl</p>" })
    );
  });

  it("sanitizes HTML", async () => {
    mockSendgridSend.mockResolvedValue(undefined);
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    const { sendCampaignEmail } = await import("../src/send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Sub",
      html: '<p>ok</p><img src="x"><script>alert(1)</script>',
    });
    const sanitized = mockSendgridSend.mock.calls[0][0].html as string;
    expect(sanitized).toContain("<p>ok</p>");
    expect(sanitized).toContain("<img src=\"x\"");
    expect(sanitized).not.toContain("<script>");
  });

  it("falls back through providers then nodemailer", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    mockSendgridSend.mockRejectedValue(new ProviderError("sg", true));
    mockResendSend.mockRejectedValue(new ProviderError("rs", false));
    mockSendMail.mockResolvedValue(undefined);
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { sendCampaignEmail } = await import("../src/send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Sub",
      html: "<p>h</p>",
      sanitize: false,
    });
    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    timeoutSpy.mockRestore();
  });

  it("uses nodemailer when no providers available", async () => {
    mockSendMail.mockResolvedValue(undefined);
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { sendCampaignEmail } = await import("../src/send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Sub",
      html: "<p>HTML</p>",
      text: "TEXT",
      sanitize: false,
    });
    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Sub",
      html: "<p>HTML</p>",
      text: "TEXT",
    });
  });
});

describe("sendWithRetry", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retries on retryable errors", async () => {
    const provider = {
      send: jest
        .fn()
        .mockRejectedValueOnce(new ProviderError("e", true))
        .mockResolvedValue(undefined),
    };
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await sendWithRetry(provider as any, {
      to: "t",
      subject: "s",
      html: "h",
      text: "t",
    });
    expect(provider.send).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    timeoutSpy.mockRestore();
  });

  it("throws immediately on non-retryable errors", async () => {
    const provider = {
      send: jest.fn().mockRejectedValue(new ProviderError("e", false)),
    };
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await expect(
      sendWithRetry(provider as any, {
        to: "t",
        subject: "s",
        html: "h",
        text: "t",
      })
    ).rejects.toThrow("e");
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });
});

describe("sendWithNodemailer", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CAMPAIGN_FROM;
  });

  it("sends mail with expected fields", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    (await import("nodemailer")).default.createTransport = jest
      .fn()
      .mockReturnValue({ sendMail });
    process.env.CAMPAIGN_FROM = "from@example.com";
    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Sub",
      html: "<p>HTML</p>",
      text: "TEXT",
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Sub",
      html: "<p>HTML</p>",
      text: "TEXT",
    });
  });
});

