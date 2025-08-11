// We'll import after setting up environment and mocks in each test

describe("sendEmail", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
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

    const { sendEmail } = await import("../sendEmail");
    await sendEmail("a@b.com", "Hello", "World");

    expect(sendMail).toHaveBeenCalledWith({
      from: "test@example.com",
      to: "a@b.com",
      subject: "Hello",
      text: "World",
    });
  });

  it("logs email details when credentials are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;

    const consoleSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));

    const { sendEmail } = await import("../sendEmail");
    await sendEmail("a@b.com", "Hi", "There");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Email to",
      "a@b.com",
      "|",
      "Hi",
      "|",
      "There"
    );

    consoleSpy.mockRestore();
  });

  it("bubbles up errors from nodemailer", async () => {
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

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { sendEmail } = await import("../sendEmail");
    await expect(sendEmail("a@b.com", "Hello", "World")).rejects.toThrow(
      "failure"
    );
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

