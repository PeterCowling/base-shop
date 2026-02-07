import { describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../test/utils/withEnv";

const FROM = "from@example.com";

describe("email provider constraints", () => {
  describe("default provider", () => {
    it("defaults to smtp in production", async () => {
      const { emailEnv } = await withEnv(
        { NODE_ENV: "production", EMAIL_FROM: FROM },
        () => import("../email"),
      );
      expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
    });

    it.each([undefined, "development", "test"]) (
      "defaults to smtp when NODE_ENV=%s",
      async (NODE_ENV) => {
        const vars: Record<string, string | undefined> = { EMAIL_FROM: FROM };
        if (NODE_ENV) vars.NODE_ENV = NODE_ENV;
        const { emailEnv } = await withEnv(vars, () => import("../email"));
        expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
      },
    );
  });

  describe("required fields", () => {
    it.each([
      ["smtp", {}],
      ["sendgrid", { SENDGRID_API_KEY: "sg" }],
      ["resend", { RESEND_API_KEY: "re" }],
    ])("requires EMAIL_FROM when provider=%s", async (provider, extras) => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            EMAIL_PROVIDER: provider as string,
            EMAIL_FROM: undefined,
            ...extras,
          },
          () =>
          import("../email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      const err = spy.mock.calls[0][1];
      expect(err).toMatchObject({ EMAIL_FROM: { _errors: ["Required"] } });
      spy.mockRestore();
    });

    it("requires SENDGRID_API_KEY for sendgrid", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_PROVIDER: "sendgrid", EMAIL_FROM: FROM },
          () => import("../email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      const err = spy.mock.calls[0][1];
      expect(err).toMatchObject({ SENDGRID_API_KEY: { _errors: ["Required"] } });
      spy.mockRestore();
    });

    it("requires RESEND_API_KEY for resend", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { EMAIL_PROVIDER: "resend", EMAIL_FROM: FROM },
          () => import("../email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      const err = spy.mock.calls[0][1];
      expect(err).toMatchObject({ RESEND_API_KEY: { _errors: ["Required"] } });
      spy.mockRestore();
    });
  });

  describe("SMTP_SECURE", () => {
    const base = { EMAIL_PROVIDER: "smtp", EMAIL_FROM: FROM } as const;
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
      ["YES", true],
      ["nO", false],
    ])("coerces %s", async (val, expected) => {
      const { emailEnv } = await withEnv(
        { ...base, SMTP_SECURE: val as string },
        () => import("../email"),
      );
      expect(emailEnv.SMTP_SECURE).toBe(expected);
    });

    it("rejects invalid values", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          { ...base, SMTP_SECURE: "maybe" },
          () => import("../email"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      const err = spy.mock.calls[0][1];
      expect(err.SMTP_SECURE._errors).toContain("must be a boolean");
      spy.mockRestore();
    });
  });

  it("lowercases EMAIL_FROM and CAMPAIGN_FROM", async () => {
    const { emailEnv } = await withEnv(
      {
        EMAIL_PROVIDER: "smtp",
        EMAIL_FROM: "Sender@Example.COM",
        CAMPAIGN_FROM: "Campaign@Example.COM",
      },
      () => import("../email"),
    );
    expect(emailEnv.EMAIL_FROM).toBe("sender@example.com");
    expect(emailEnv.CAMPAIGN_FROM).toBe("campaign@example.com");
  });
});
