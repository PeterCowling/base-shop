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

    const { sendEmail } = await import("../../src/lib/email");
    await sendEmail("a@b.com", "Hello", "World");
    expect(sendMail).toHaveBeenCalledWith({
      from: "test@example.com",
      to: "a@b.com",
      subject: "Hello",
      text: "World",
    });
  });

  it("logs when credentials are missing", async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    } as NodeJS.ProcessEnv;
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: jest.fn() },
      createTransport: jest.fn(),
    }));

    const { sendEmail } = await import("../../src/lib/email");
    await sendEmail("a@b.com", "Hi", "There");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
