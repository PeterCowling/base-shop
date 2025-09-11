/** @jest-environment node */
import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "./test-helpers";

const load = async () => (await import("../email.ts")).emailEnv;

describe("email env loader", () => {
  describe.each([
    ["25", 25],
    ["abc", "error"],
  ])("SMTP_PORT=%s", (value, outcome) => {
    it(outcome === "error" ? "rejects" : "parses", async () => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: value,
          SMTP_SECURE: "false",
          CAMPAIGN_FROM: "from@example.com",
        },
        async () => {
          const spy = jest.spyOn(console, "error").mockImplementation(() => {});
          if (outcome === "error") {
            await expect(load()).rejects.toThrow(
              "Invalid email environment variables",
            );
            expect(spy).toHaveBeenCalled();
            const err = spy.mock.calls[0][1];
            expect(err.SMTP_PORT._errors).toContain("must be a number");
          } else {
            const env = await load();
            expect(env.SMTP_PORT).toBe(outcome);
            expect(spy).not.toHaveBeenCalled();
          }
          spy.mockRestore();
        },
      );
    });
  });

  describe.each([
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
    ["yes", true],
    ["no", false],
    ["foo", "error"],
  ])("SMTP_SECURE=%s", (value, outcome) => {
    it(outcome === "error" ? "rejects" : "coerces", async () => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "25",
          SMTP_SECURE: value,
          CAMPAIGN_FROM: "from@example.com",
        },
        async () => {
          const spy = jest.spyOn(console, "error").mockImplementation(() => {});
          if (outcome === "error") {
            await expect(load()).rejects.toThrow(
              "Invalid email environment variables",
            );
            expect(spy).toHaveBeenCalled();
            const err = spy.mock.calls[0][1];
            expect(err.SMTP_SECURE._errors).toContain("must be a boolean");
          } else {
            const env = await load();
            expect(env.SMTP_SECURE).toBe(outcome);
            expect(spy).not.toHaveBeenCalled();
          }
          spy.mockRestore();
        },
      );
    });
  });

  describe.each([
    ["sendgrid", {}, "error"],
    ["sendgrid", { SENDGRID_API_KEY: "sg-key" }, "ok"],
    ["resend", {}, "error"],
    ["resend", { RESEND_API_KEY: "re-key" }, "ok"],
  ])("provider %s", (provider, extras, outcome) => {
    it(outcome === "error" ? "rejects" : "loads", async () => {
      await withEnv(
        { EMAIL_PROVIDER: provider, ...extras },
        async () => {
          const spy = jest.spyOn(console, "error").mockImplementation(() => {});
          if (outcome === "error") {
            await expect(load()).rejects.toThrow(
              "Invalid email environment variables",
            );
            expect(spy).toHaveBeenCalled();
          } else {
            const env = await load();
            if (provider === "sendgrid") {
              expect(env.SENDGRID_API_KEY).toBe("sg-key");
            } else {
              expect(env.RESEND_API_KEY).toBe("re-key");
            }
            expect(spy).not.toHaveBeenCalled();
          }
          spy.mockRestore();
        },
      );
    });
  });

  it("logs and throws on invalid env", async () => {
    await withEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "abc",
        SMTP_SECURE: "false",
        CAMPAIGN_FROM: "from@example.com",
      },
      async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        await expect(load()).rejects.toThrow(
          "Invalid email environment variables",
        );
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
      },
    );
  });
});
