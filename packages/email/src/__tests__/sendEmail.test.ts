// We'll import after setting up environment and mocks in each test

describe("sendEmail", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it("sends email via nodemailer when credentials exist", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "test@example.com",
      GMAIL_PASS: "secret",
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const sendMail = jest.fn().mockResolvedValue(undefined);
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport },
      createTransport,
    }));
    const getDefaultSender = jest.fn(() => "sender@example.com");
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");

    expect(createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: "test@example.com",
        pass: "secret",
      },
    });

    await sendEmail("a@b.com", "Hello", "World");

    expect(sendMail).toHaveBeenCalledWith({
      from: "sender@example.com",
      to: "a@b.com",
      subject: "Hello",
      text: "World",
    });
    expect(getDefaultSender).toHaveBeenCalled();
  });

  it("simulates email when credentials are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      EMAIL_LOG_LEVEL: "info",
    } as NodeJS.ProcessEnv;

    const infoSpy = jest.fn();
    const pinoMock = jest.fn(() => ({ info: infoSpy }));
    jest.doMock("pino", () => ({
      __esModule: true,
      default: pinoMock,
    }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));
    const getDefaultSender = jest.fn();
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");
    await sendEmail("a@b.com", "Hi", "There");

    expect(infoSpy).toHaveBeenCalledWith({ to: "a@b.com" }, "Email simulated");
    expect(pinoMock).toHaveBeenCalledWith({ level: "info" });
    expect(getDefaultSender).not.toHaveBeenCalled();
  });

  it("simulates email when only GMAIL_USER is set", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "test@example.com",
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      EMAIL_LOG_LEVEL: "info",
    } as NodeJS.ProcessEnv;

    const infoSpy = jest.fn();
    const pinoMock = jest.fn(() => ({ info: infoSpy }));
    jest.doMock("pino", () => ({
      __esModule: true,
      default: pinoMock,
    }));
    const createTransport = jest.fn();
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport },
      createTransport,
    }));
    const getDefaultSender = jest.fn();
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");
    await sendEmail("a@b.com", "Hi", "There");

    expect(createTransport).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith({ to: "a@b.com" }, "Email simulated");
    expect(pinoMock).toHaveBeenCalledWith({ level: "info" });
    expect(getDefaultSender).not.toHaveBeenCalled();
  });

  it("defaults to silent log level when EMAIL_LOG_LEVEL is not set", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const infoSpy = jest.fn();
    const pinoMock = jest.fn(() => ({ info: infoSpy }));
    jest.doMock("pino", () => ({
      __esModule: true,
      default: pinoMock,
    }));
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));
    const getDefaultSender = jest.fn();
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");
    await sendEmail("a@b.com", "Hi", "There");

    expect(infoSpy).toHaveBeenCalledWith({ to: "a@b.com" }, "Email simulated");
    expect(pinoMock).toHaveBeenCalledWith({ level: "silent" });
    expect(getDefaultSender).not.toHaveBeenCalled();
  });

  it("propagates errors from nodemailer", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "test@example.com",
      GMAIL_PASS: "secret",
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const error = new Error("failure");
    const sendMail = jest.fn().mockRejectedValue(error);
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: () => ({ sendMail }) },
      createTransport: () => ({ sendMail }),
    }));
    const getDefaultSender = jest.fn(() => "sender@example.com");
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");
    await expect(
      sendEmail("a@b.com", "Hello", "World")
    ).rejects.toThrow("failure");
    expect(getDefaultSender).toHaveBeenCalled();
  });

  it("logs and rethrows when getDefaultSender throws", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "test@example.com",
      GMAIL_PASS: "secret",
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const sendMail = jest.fn();
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: () => ({ sendMail }) },
      createTransport: () => ({ sendMail }),
    }));

    const error = new Error("boom");
    const getDefaultSender = jest.fn(() => {
      throw error;
    });
    jest.doMock("../config", () => ({ getDefaultSender }));

    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    const { sendEmail } = await import("../sendEmail");
    await expect(
      sendEmail("a@b.com", "Hello", "World")
    ).rejects.toThrow("boom");

    expect(errorSpy).toHaveBeenCalledWith("Error sending email", error);
    errorSpy.mockRestore();
  });
});
