jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("sendEmail", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
  });

  it("uses nodemailer when credentials are present", async () => {
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

    const { sendEmail } = await import("../../../packages/email/src/sendEmail");
    await sendEmail("a@b.com", "Hello", "World");
    expect(sendMail).toHaveBeenCalledWith({
      from: "test@example.com",
      to: "a@b.com",
      subject: "Hello",
      text: "World",
    });
  });

  it("throws and logs when nodemailer fails", async () => {
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

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await import("../../../packages/email/src/sendEmail");
    await expect(
      sendEmail("a@b.com", "Hello", "World")
    ).rejects.toThrow("failure");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("logs when credentials are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;
    const info = jest.fn();
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));
    jest.doMock("pino", () => () => ({ info }));

    const { sendEmail } = await import("../../../packages/email/src/sendEmail");
    await sendEmail("a@b.com", "Hi", "There");
    expect(info).toHaveBeenCalled();
  });
});
