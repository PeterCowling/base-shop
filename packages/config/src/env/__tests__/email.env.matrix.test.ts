import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./test-helpers";

const loadEnv = async () => (await import("../email.ts")).emailEnv;

describe("email provider matrix", () => {
  it.each([
    ["resend", { RESEND_API_KEY: "rk" }],
    ["sendgrid", { SENDGRID_API_KEY: "sg" }],
    ["smtp", {}],
    ["noop", {}],
  ])("loads %s", async (EMAIL_PROVIDER, vars) => {
    await withEnv(
      {
        EMAIL_PROVIDER,
        ...(EMAIL_PROVIDER === "noop"
          ? {}
          : { EMAIL_FROM: "from@example.com" }),
        ...vars,
      },
      async () => {
        const env = await loadEnv();
        expect(env.EMAIL_PROVIDER).toBe(EMAIL_PROVIDER);
      },
    );
  });

  it("rejects unknown provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ EMAIL_PROVIDER: "???" }, async () => {
        await loadEnv();
      }),
    ).rejects.toThrow("Invalid email environment variables");
    const err = spy.mock.calls[0][1];
    expect(err.EMAIL_PROVIDER).toBeDefined();
    spy.mockRestore();
  });
});

describe("sender requirements", () => {
  it("fails when EMAIL_FROM missing for non-noop", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ EMAIL_PROVIDER: "smtp", EMAIL_FROM: undefined }, async () => {
        await loadEnv();
      }),
    ).rejects.toThrow("Invalid email environment variables");
    const err = spy.mock.calls[0][1];
    expect(err.EMAIL_FROM._errors).toContain("Required");
    spy.mockRestore();
  });

  it("allows missing EMAIL_FROM for noop", async () => {
    await withEnv({ EMAIL_PROVIDER: "noop", EMAIL_FROM: undefined }, async () => {
      const env = await loadEnv();
      expect(env.EMAIL_FROM).toBeUndefined();
    });
  });

  it("allows optional EMAIL_SENDER_NAME", async () => {
    await withEnv(
      { EMAIL_PROVIDER: "smtp", EMAIL_FROM: "from@example.com" },
      async () => {
        const env = await loadEnv();
        expect(env.EMAIL_SENDER_NAME).toBeUndefined();
      },
    );
  });
});

describe("smtp secure coercion", () => {
  it.each([
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
    ["yes", true],
    ["no", false],
  ])("coerces %s", async (val, expected) => {
    await withEnv(
      {
        EMAIL_PROVIDER: "smtp",
        EMAIL_FROM: "from@example.com",
        SMTP_SECURE: val as string,
      },
      async () => {
        const env = await loadEnv();
        expect(env.SMTP_SECURE).toBe(expected);
      },
    );
  });

  it("rejects invalid SMTP_SECURE", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          EMAIL_FROM: "from@example.com",
          SMTP_SECURE: "invalid",
        },
        async () => {
          await loadEnv();
        },
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const err = spy.mock.calls[0][1];
    expect(err.SMTP_SECURE._errors).toContain("must be a boolean");
    spy.mockRestore();
  });
});
