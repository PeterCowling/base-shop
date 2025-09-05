/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

// use const to hold original env
const ORIGINAL_ENV = process.env;
let warnSpy: jest.SpyInstance;

afterEach(() => {
  if (warnSpy) {
    warnSpy.mockRestore();
  }
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("payments env", () => {
  it("returns provided values without warnings", () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    };
    process.env = {
      ...env,
      PAYMENTS_SANDBOX: "true",
    } as unknown as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual(env);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns provided values without warnings (ts import)", async () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    };
    process.env = {
      ...env,
      PAYMENTS_SANDBOX: "true",
    } as unknown as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = await import("../payments.ts");
    expect(paymentsEnv).toEqual(env);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("payments env defaults", () => {
  it.each([
    {
      name: "malformed values",
      env: {
        STRIPE_SECRET_KEY: 123 as unknown as string,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
        STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
      },
    },
    {
      name: "empty strings",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
  ])(
    "warns and falls back to defaults when variables are $name",
    ({ env }) => {
      process.env = env as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = require("../payments.js");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it("warns and uses schema defaults for malformed variables", () => {
    process.env = {
      STRIPE_SECRET_KEY: 123 as unknown as string,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
      STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
    } as unknown as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv, paymentsEnvSchema } = require("../payments.js");
    const defaults = paymentsEnvSchema.parse({});
    expect(paymentsEnv).toEqual(defaults);
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });

  it("warns with formatted errors when variables have invalid types", () => {
    process.env = {
      STRIPE_SECRET_KEY: 123 as unknown as string,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
      STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
    } as unknown as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      {
        _errors: [],
        STRIPE_SECRET_KEY: { _errors: ["Expected string, received number"] },
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
          _errors: ["Expected string, received number"],
        },
        STRIPE_WEBHOOK_SECRET: {
          _errors: ["Expected string, received number"],
        },
      },
    );
  });

  it(
    "warns with formatted errors when variables have invalid types (ts import)",
    async () => {
      process.env = {
        STRIPE_SECRET_KEY: 123 as unknown as string,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
        STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
      } as unknown as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        {
          _errors: [],
          STRIPE_SECRET_KEY: { _errors: ["Expected string, received number"] },
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
            _errors: ["Expected string, received number"],
          },
          STRIPE_WEBHOOK_SECRET: {
            _errors: ["Expected string, received number"],
          },
        },
      );
    },
  );

  it("warns and falls back to defaults when STRIPE_SECRET_KEY is empty", () => {
    process.env = {
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    } as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });

  it.each([
    {
      name: "malformed values",
      env: {
        STRIPE_SECRET_KEY: 123 as unknown as string,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
        STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
      },
    },
    {
      name: "empty strings",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
    ])(
      "warns and falls back to defaults when variables are $name (ts import)",
      async ({ env }) => {
        process.env = env as unknown as NodeJS.ProcessEnv;
        warnSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        jest.resetModules();
        const { paymentsEnv } = await import("../payments.ts");
        expect(paymentsEnv).toEqual({
          STRIPE_SECRET_KEY: "sk_test",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
          STRIPE_WEBHOOK_SECRET: "whsec_test",
          PAYMENTS_SANDBOX: true,
          PAYMENTS_CURRENCY: "USD",
        });
        expect(warnSpy).toHaveBeenCalledWith(
          "⚠️ Invalid payments environment variables:",
          expect.any(Object),
        );
      },
    );

    it.each([
      {
        name: "STRIPE_SECRET_KEY",
        env: {
          STRIPE_SECRET_KEY: "sk_live_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
          STRIPE_WEBHOOK_SECRET: "",
        },
      },
      {
        name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        env: {
          STRIPE_SECRET_KEY: "",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
          STRIPE_WEBHOOK_SECRET: "",
        },
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        env: {
          STRIPE_SECRET_KEY: "",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
          STRIPE_WEBHOOK_SECRET: "whsec_live_123",
        },
      },
    ])(
      "warns and falls back to defaults when only $name is valid",
      async ({ env }) => {
        process.env = env as NodeJS.ProcessEnv;
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.resetModules();
        const { paymentsEnv } = await import("../payments.ts");
        expect(paymentsEnv).toEqual({
          STRIPE_SECRET_KEY: "sk_test",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
          STRIPE_WEBHOOK_SECRET: "whsec_test",
          PAYMENTS_SANDBOX: true,
          PAYMENTS_CURRENCY: "USD",
        });
        expect(warnSpy).toHaveBeenCalledWith(
          "⚠️ Invalid payments environment variables:",
          expect.any(Object),
        );
      },
    );

  it(
    "warns and falls back to defaults when STRIPE_SECRET_KEY is empty (ts import)",
    async () => {
      process.env = {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      } as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it(
    "warns and falls back to defaults when all variables are empty (ts import)",
    async () => {
      process.env = {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      } as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it(
    "warns and falls back to defaults when STRIPE_SECRET_KEY is missing",
    async () => {
      process.env = {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      } as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        PAYMENTS_SANDBOX: true,
        PAYMENTS_CURRENCY: "USD",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );
});

describe("payment gateway flag", () => {
  it("uses defaults without warnings when gateway disabled", () => {
    process.env = {
      PAYMENTS_GATEWAY: "disabled",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    } as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns provided test keys when stripe gateway active", () => {
    process.env = {
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "sk_test_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_test_abc",
    } as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_test_abc",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns provided live keys when stripe gateway active", () => {
    process.env = {
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "sk_live_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_live_abc",
    } as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_live_abc",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_live_abc",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns and falls back to defaults when stripe gateway active but keys missing", () => {
    process.env = {
      PAYMENTS_GATEWAY: "stripe",
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    } as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});

