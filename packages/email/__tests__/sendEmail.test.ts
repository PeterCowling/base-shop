import type { Mock } from "jest-mock";

describe("getDefaultSender", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("uses CAMPAIGN_FROM, trimming and lowercasing", async () => {
    process.env.CAMPAIGN_FROM = "  Test@Example.COM  ";
    const { getDefaultSender } = await import("../src/config");
    expect(getDefaultSender()).toBe("test@example.com");
  });

  it("falls back to GMAIL_USER", async () => {
    delete process.env.CAMPAIGN_FROM;
    process.env.GMAIL_USER = "USER@Example.COM ";
    const { getDefaultSender } = await import("../src/config");
    expect(getDefaultSender()).toBe("user@example.com");
  });

  it("throws when no sender env var is set", async () => {
    delete process.env.CAMPAIGN_FROM;
    delete process.env.GMAIL_USER;
    const { getDefaultSender } = await import("../src/config");
    expect(() => getDefaultSender()).toThrow(
      "Default sender email is required. Set CAMPAIGN_FROM or GMAIL_USER."
    );
  });

  it("throws on invalid email", async () => {
    process.env.CAMPAIGN_FROM = "not-an-email";
    const { getDefaultSender } = await import("../src/config");
    expect(() => getDefaultSender()).toThrow("Invalid sender email address");
  });
});

describe("sendEmail", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it("passes getDefaultSender result to nodemailer", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "gmail@example.com",
      GMAIL_PASS: "secret",
    } as NodeJS.ProcessEnv;

    const sendMail = jest.fn().mockResolvedValue(undefined);
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport },
      createTransport,
    }));
    const getDefaultSender: Mock = jest.fn(() => "sender@example.com");
    jest.doMock("../src/config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../src/sendEmail");
    await sendEmail("to@example.com", "Subject", "Body");

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "sender@example.com" })
    );
    expect(getDefaultSender).toHaveBeenCalled();
  });

  it("rethows errors from nodemailer", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "gmail@example.com",
      GMAIL_PASS: "secret",
    } as NodeJS.ProcessEnv;

    const error = new Error("fail");
    const sendMail = jest.fn().mockRejectedValue(error);
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport },
      createTransport,
    }));
    const getDefaultSender: Mock = jest.fn(() => "sender@example.com");
    jest.doMock("../src/config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../src/sendEmail");
    await expect(
      sendEmail("to@example.com", "Subject", "Body")
    ).rejects.toThrow(error);
  });

  it("logs when credentials are missing", async () => {
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;

    const info = jest.fn();
    const pinoMock = jest.fn(() => ({ info }));
    jest.doMock("pino", () => ({ __esModule: true, default: pinoMock }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));

    const { sendEmail } = await import("../src/sendEmail");
    await expect(
      sendEmail("to@example.com", "Subject", "Body")
    ).resolves.toBeUndefined();

    expect(info).toHaveBeenCalledWith(
      { to: "to@example.com" },
      "Email simulated"
    );
  });
});

