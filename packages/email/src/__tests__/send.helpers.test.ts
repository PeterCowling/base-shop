let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
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

describe("send helpers", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn().mockResolvedValue(undefined);
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.SMTP_URL;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("deriveText strips tags and entities", async () => {
    const { deriveText } = await import("../send");
    const html =
      '<style>.x{}</style><script>alert(1)</script><p>Hello&nbsp;<strong>world</strong>&lt;3 &amp; &quot;double&quot; and &#39;single&#39;</p>';
    expect(deriveText(html)).toBe(`Hello world <3 & "double" and 'single'`);
  });

  it("ensureText throws when html missing", async () => {
    const { ensureText } = await import("../send");
    expect(() =>
      ensureText({ to: "to@example.com", subject: "Subject" })
    ).toThrow("Missing html content for campaign email");
  });

  describe("loadProvider", () => {
    it("resolves SendgridProvider and ResendProvider when API keys present", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      process.env.RESEND_API_KEY = "rs";
      const { loadProvider } = await import("../send");
      const sg = await loadProvider("sendgrid");
      const rs = await loadProvider("resend");
      const { SendgridProvider } = await import("../providers/sendgrid");
      const { ResendProvider } = await import("../providers/resend");
      expect(sg).toBeDefined();
      expect(rs).toBeDefined();
      expect(SendgridProvider).toHaveBeenCalledTimes(1);
      expect(ResendProvider).toHaveBeenCalledTimes(1);
    });

    it("returns undefined when API keys missing", async () => {
      const { loadProvider } = await import("../send");
      const sg = await loadProvider("sendgrid");
      const rs = await loadProvider("resend");
      expect(sg).toBeUndefined();
      expect(rs).toBeUndefined();
    });
  });

  describe("sendWithRetry", () => {
    it("retries on retryable errors and succeeds", async () => {
      const { sendWithRetry } = await import("../send");
      const { ProviderError } = await import("../providers/types");
      const provider = {
        send: jest
          .fn()
          .mockRejectedValueOnce(new ProviderError("fail", true))
          .mockResolvedValueOnce(undefined),
      };
      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation((fn: any) => {
          fn();
          return 0 as any;
        });

      await sendWithRetry(provider, {
        to: "a",
        subject: "b",
        html: "<p>x</p>",
        text: "x",
      });

      expect(provider.send).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      setTimeoutSpy.mockRestore();
    });

    it("retries primitive rejections and succeeds", async () => {
      const { sendWithRetry } = await import("../send");
      const provider = {
        send: jest
          .fn()
          .mockRejectedValueOnce("fail")
          .mockRejectedValueOnce("fail again")
          .mockResolvedValueOnce(undefined),
      };
      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation((fn: any) => {
          fn();
          return 0 as any;
        });

      await sendWithRetry(provider, {
        to: "a",
        subject: "b",
        html: "<p>x</p>",
        text: "x",
      });

      expect(provider.send).toHaveBeenCalledTimes(3);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
      setTimeoutSpy.mockRestore();
    });

    it("does not retry on non-retryable errors", async () => {
      const { sendWithRetry } = await import("../send");
      const { ProviderError } = await import("../providers/types");
      const error = new ProviderError("fail", false);
      const provider = { send: jest.fn().mockRejectedValue(error) };
      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation((fn: any) => {
          fn();
          return 0 as any;
        });

      await expect(
        sendWithRetry(provider, {
          to: "a",
          subject: "b",
          html: "<p>x</p>",
          text: "x",
        })
      ).rejects.toThrow(error);
      expect(provider.send).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
    });

    it("fails after reaching maxRetries", async () => {
      const { sendWithRetry } = await import("../send");
      const { ProviderError } = await import("../providers/types");
      const error = new ProviderError("fail", true);
      const provider = { send: jest.fn().mockRejectedValue(error) };
      const setTimeoutSpy = jest
        .spyOn(global, "setTimeout")
        .mockImplementation((fn: any) => {
          fn();
          return 0 as any;
        });

      await expect(
        sendWithRetry(
          provider,
          {
            to: "a",
            subject: "b",
            html: "<p>x</p>",
            text: "x",
          },
          2
        )
      ).rejects.toBe(error);
      expect(provider.send).toHaveBeenCalledTimes(2);
      setTimeoutSpy.mockRestore();
    });
  });

  it("sendWithNodemailer forwards options", async () => {
    process.env.CAMPAIGN_FROM = "from@example.com";
    process.env.SMTP_URL = "smtp://localhost";
    const { sendWithNodemailer } = await import("../send");

    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    const nodemailer = await import("nodemailer");
    expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
      url: "smtp://localhost",
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
  });
});
