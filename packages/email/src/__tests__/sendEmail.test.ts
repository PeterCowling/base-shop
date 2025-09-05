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
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: () => ({ sendMail }) },
      createTransport: () => ({ sendMail }),
    }));
    const getDefaultSender = jest.fn(() => "sender@example.com");
    jest.doMock("../config", () => ({ getDefaultSender }));

    const { sendEmail } = await import("../sendEmail");
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
    } as NodeJS.ProcessEnv;

    const infoSpy = jest.fn();
    jest.doMock("pino", () => ({
      __esModule: true,
      default: () => ({ info: infoSpy }),
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
});
