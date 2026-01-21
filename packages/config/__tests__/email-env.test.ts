import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

describe("email-env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("SMTP_PORT", () => {
    it.each([
      ["587", 587],
      [" 25 ", 25],
    ])("coerces %p to number %p", async (input, expected) => {
      const { emailEnv } = await withEnv(
        { EMAIL_FROM: "from@example.com", SMTP_PORT: input },
        () => import("../src/env/email"),
      );
      expect(emailEnv.SMTP_PORT).toBe(expected);
    });

    it("rejects non-numeric values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_FROM: "from@example.com", SMTP_PORT: "abc" },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("SMTP_SECURE", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["yes", true],
      ["no", false],
      ["1", true],
      ["0", false],
    ])("parses %p", async (input, expected) => {
      const { emailEnv } = await withEnv(
        { EMAIL_FROM: "from@example.com", SMTP_SECURE: input },
        () => import("../src/env/email"),
      );
      expect(emailEnv.SMTP_SECURE).toBe(expected);
    });

    it("rejects invalid values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_FROM: "from@example.com", SMTP_SECURE: "maybe" },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("CAMPAIGN_FROM", () => {
    it("trims and lowercases", async () => {
      const { emailEnv } = await withEnv(
        {
          EMAIL_FROM: "from@example.com",
          CAMPAIGN_FROM: "  Admin@Example.com  ",
        },
        () => import("../src/env/email"),
      );
      expect(emailEnv.CAMPAIGN_FROM).toBe("admin@example.com");
    });

    it("rejects invalid email", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_FROM: "from@example.com", CAMPAIGN_FROM: "notanemail" },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("provider requirements", () => {
    it.each([
      ["smtp", {}],
      ["sendgrid", { SENDGRID_API_KEY: "sg" }],
      ["resend", { RESEND_API_KEY: "rk" }],
    ])(
      "requires EMAIL_FROM when EMAIL_PROVIDER=%s",
      async (provider, extras) => {
        const spy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(
          withEnv(
            { EMAIL_PROVIDER: provider as string, EMAIL_FROM: undefined, ...extras },
            () => import("../src/env/email"),
          ),
        ).rejects.toThrow("Invalid email environment variables");
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toBe(
          "❌ Invalid email environment variables:",
        );
        const err = spy.mock.calls[0][1];
        expect(err.EMAIL_FROM._errors).toContain("Required");
        spy.mockRestore();
      },
    );

    it("allows missing EMAIL_FROM for noop provider", async () => {
      const { emailEnv } = await withEnv(
        { EMAIL_PROVIDER: "noop", EMAIL_FROM: undefined },
        () => import("../src/env/email"),
      );
      expect(emailEnv.EMAIL_PROVIDER).toBe("noop");
      expect(emailEnv.EMAIL_FROM).toBeUndefined();
    });

    it("errors when SENDGRID_API_KEY is missing", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            EMAIL_PROVIDER: "sendgrid",
            EMAIL_FROM: "from@example.com",
            SENDGRID_API_KEY: undefined,
          },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBe(
          "❌ Invalid email environment variables:",
      );
      const err = spy.mock.calls[0][1];
      expect(err.SENDGRID_API_KEY._errors).toContain("Required");
      spy.mockRestore();
    });

    it("errors when RESEND_API_KEY is missing", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            EMAIL_PROVIDER: "resend",
            EMAIL_FROM: "from@example.com",
            RESEND_API_KEY: undefined,
          },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBe(
          "❌ Invalid email environment variables:",
      );
      const err = spy.mock.calls[0][1];
      expect(err.RESEND_API_KEY._errors).toContain("Required");
      spy.mockRestore();
    });

    it("succeeds when required keys provided", async () => {
      const { emailEnv: sendgridEnv } = await withEnv(
        {
          EMAIL_PROVIDER: "sendgrid",
          EMAIL_FROM: "from@example.com",
          SENDGRID_API_KEY: "sg",
        },
        () => import("../src/env/email"),
      );
      expect(sendgridEnv.EMAIL_PROVIDER).toBe("sendgrid");
      expect(sendgridEnv.SENDGRID_API_KEY).toBe("sg");

      const { emailEnv: resendEnv } = await withEnv(
        {
          EMAIL_PROVIDER: "resend",
          EMAIL_FROM: "from@example.com",
          RESEND_API_KEY: "rk",
        },
        () => import("../src/env/email"),
      );
      expect(resendEnv.EMAIL_PROVIDER).toBe("resend");
      expect(resendEnv.RESEND_API_KEY).toBe("rk");
    });
  });
});
