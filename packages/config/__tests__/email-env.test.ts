import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("email-env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("SMTP_PORT", () => {
    it("accepts numeric strings", async () => {
      const { emailEnv } = await withEnv(
        { SMTP_PORT: "587" },
        () => import("../src/env/email"),
      );
      expect(emailEnv.SMTP_PORT).toBe(587);
    });

    it("rejects non-numeric values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv({ SMTP_PORT: "abc" }, () => import("../src/env/email")),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("SMTP_SECURE", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["yes", true],
      ["0", false],
    ])("parses %p", async (input, expected) => {
      const { emailEnv } = await withEnv(
        { SMTP_SECURE: input },
        () => import("../src/env/email"),
      );
      expect(emailEnv.SMTP_SECURE).toBe(expected);
    });

    it("rejects invalid values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv({ SMTP_SECURE: "maybe" }, () => import("../src/env/email")),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("CAMPAIGN_FROM", () => {
    it("trims and lowercases", async () => {
      const { emailEnv } = await withEnv(
        { CAMPAIGN_FROM: "  Admin@Example.com  " },
        () => import("../src/env/email"),
      );
      expect(emailEnv.CAMPAIGN_FROM).toBe("admin@example.com");
    });

    it("rejects invalid email", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv({ CAMPAIGN_FROM: "notanemail" }, () => import("../src/env/email")),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("provider requirements", () => {
    it("errors when SENDGRID_API_KEY is missing", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_PROVIDER: "sendgrid", EMAIL_FROM: "from@example.com" },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
    });

    it("errors when RESEND_API_KEY is missing", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_PROVIDER: "resend", EMAIL_FROM: "from@example.com" },
          () => import("../src/env/email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(spy).toHaveBeenCalled();
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

