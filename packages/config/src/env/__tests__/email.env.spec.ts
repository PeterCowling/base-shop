import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./test-helpers";

const load = async () => (await import("../email.ts")).emailEnv;

describe("email provider loader", () => {
  it.each([
    ["resend", { RESEND_API_KEY: "rk" }],
    ["sendgrid", { SENDGRID_API_KEY: "sg" }],
  ])("loads %s provider", async (EMAIL_PROVIDER, vars) => {
    await withEnv(
      { EMAIL_PROVIDER, EMAIL_FROM: "n@x.com", ...vars },
      async () => {
        const loader = await load();
        const env = typeof loader === "function" ? loader() : loader;
        const provider = (env as any).provider ?? env.EMAIL_PROVIDER;
        expect(provider).toBe(EMAIL_PROVIDER);
      },
    );
  });

  it("throws on unknown EMAIL_PROVIDER", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "???", EMAIL_FROM: "n@x.com" },
        async () => {
          const loader = await load();
          if (typeof loader === "function") loader();
        },
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const err = spy.mock.calls[0][1];
    expect(err.EMAIL_PROVIDER).toBeDefined();
    spy.mockRestore();
  });
});
