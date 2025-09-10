import { deriveText, ensureText, loadProvider, sendWithRetry, sendWithNodemailer } from "../src/send";
import { ProviderError } from "../src/providers/types";

describe("deriveText", () => {
  it("strips HTML, style/script blocks, decodes entities and normalizes whitespace", () => {
    const html = `<style>p{color:red}</style><script>alert('x')</script><div> Hello&nbsp;world &amp; &lt;test&gt; &#39;quote&#39; &quot;double&quot; </div>`;
    const text = deriveText(html);
    expect(text).toBe("Hello world & <test> 'quote' \"double\"");
  });
});

describe("ensureText", () => {
  it("throws when html is missing", () => {
    expect(() => ensureText({ to: "a", subject: "b" })).toThrow(
      "Missing html content for campaign email"
    );
  });

  it("appends derived text when missing", () => {
    const options = ensureText({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello&nbsp;world</p>",
    });
    expect(options.text).toBe("Hello world");
  });
});

describe("loadProvider", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("returns SendgridProvider when API key is set and caches the result", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: ctor }));
    const { loadProvider } = await import("../src/send");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    expect(first).toBeDefined();
    expect(first).toBe(second);
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("returns ResendProvider when API key is set", async () => {
    process.env.RESEND_API_KEY = "rs";
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../src/providers/resend", () => ({ ResendProvider: ctor }));
    const { loadProvider } = await import("../src/send");
    const provider = await loadProvider("resend");
    expect(provider).toBeDefined();
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when API key is missing and caches the result", async () => {
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: ctor }));
    const { SendgridProvider } = await import("../src/providers/sendgrid");
    new SendgridProvider();
    const { loadProvider } = await import("../src/send");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});

describe("sendWithRetry", () => {
  it("retries on retryable errors with exponential backoff", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockResolvedValueOnce(undefined);
    await sendWithRetry({ send } as any, {
      to: "t",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    expect(send).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    timeoutSpy.mockRestore();
  });

  it("stops on non-retryable errors", async () => {
    const send = jest.fn().mockRejectedValue(new ProviderError("fail", false));
    await expect(
      sendWithRetry({ send } as any, {
        to: "t",
        subject: "s",
        html: "<p>h</p>",
        text: "h",
      })
    ).rejects.toThrow("fail");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("stops when error has retryable false", async () => {
    const error = { retryable: false };
    const send = jest.fn().mockRejectedValue(error);
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await expect(
      sendWithRetry({ send } as any, {
        to: "t",
        subject: "s",
        html: "<p>h</p>",
        text: "h",
      })
    ).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("retries unknown errors three times", async () => {
    jest.useFakeTimers();
    const error = {};
    const send = jest.fn().mockRejectedValue(error);
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const promise = sendWithRetry({ send } as any, {
      to: "t",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    });
    void promise.catch(() => {});
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);
    await expect(promise).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});

describe("sendWithNodemailer", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.SMTP_URL;
  });

  it("passes SMTP_URL and forwards fields", async () => {
    process.env.SMTP_URL = "smtp://example";
    const sendMail = jest.fn();
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({ __esModule: true, default: { createTransport } }));
    jest.doMock("../src/config", () => ({ getDefaultSender: () => "from@example.com" }));
    const { sendWithNodemailer } = await import("../src/send");
    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
    expect(createTransport).toHaveBeenCalledWith({ url: "smtp://example" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
  });

  it("surfaces sendMail errors", async () => {
    process.env.SMTP_URL = "smtp://example";
    const sendMail = jest.fn().mockRejectedValue(new Error("smtp fail"));
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({ __esModule: true, default: { createTransport } }));
    jest.doMock("../src/config", () => ({ getDefaultSender: () => "from@example.com" }));
    const { sendWithNodemailer } = await import("../src/send");
    await expect(
      sendWithNodemailer({
        to: "to@example.com",
        subject: "Subj",
        html: "<p>HTML</p>",
        text: "text",
      })
    ).rejects.toThrow("smtp fail");
    expect(createTransport).toHaveBeenCalledWith({ url: "smtp://example" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
  });
});
