/** @jest-environment node */
// packages/stripe/src/__tests__/client-instantiation.test.ts

describe("stripe client instantiation", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it("requires STRIPE_SECRET_KEY", async () => {
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));
    await expect(import("../index.ts")).rejects.toThrow(
      "Neither apiKey nor config.authenticator provided",
    );
  });

  it("passes expected options to Stripe constructor", async () => {
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    const httpClient = {};
    const createHttpClient = jest.fn().mockReturnValue(httpClient);
    const StripeMock = jest.fn().mockImplementation(() => ({})) as jest.Mock & { createFetchHttpClient: jest.Mock };
    StripeMock.createFetchHttpClient = createHttpClient;

    jest.doMock("stripe", () => ({ __esModule: true, default: StripeMock }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_test_123" },
    }));

    await import("../index.ts");

    expect(createHttpClient).toHaveBeenCalled();
    expect(StripeMock).toHaveBeenCalledWith("sk_test_123", {
      apiVersion: "2025-06-30.basil",
      httpClient,
    });
  });

  it("caches instance and respects secret changes after reset", async () => {
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    const StripeMock = jest.fn().mockImplementation((key: string) => ({ key })) as jest.Mock & { createFetchHttpClient: jest.Mock };
    StripeMock.createFetchHttpClient = jest.fn().mockReturnValue({});

    jest.doMock("stripe", () => ({ __esModule: true, default: StripeMock }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_old" },
    }));

    const mod1 = await import("../index.ts");
    const mod2 = await import("../index.ts");

    expect(mod1.stripe).toBe(mod2.stripe);
    expect(StripeMock).toHaveBeenCalledTimes(1);

    jest.resetModules();
    StripeMock.mockClear();
    jest.doMock("stripe", () => ({ __esModule: true, default: StripeMock }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_new" },
    }));

    const mod3 = await import("../index.ts");
    expect(StripeMock).toHaveBeenCalledWith("sk_new", expect.any(Object));
    expect((mod3.stripe as unknown as { key: string }).key).toBe("sk_new");
  });

  it("creates real client when STRIPE_USE_MOCK toggles off", async () => {
    const StripeCtor = jest.fn().mockImplementation((key: string) => ({ key })) as jest.Mock & { createFetchHttpClient: jest.Mock };
    StripeCtor.createFetchHttpClient = jest.fn().mockReturnValue({});

    process.env = {
      ...OLD_ENV,
      STRIPE_USE_MOCK: "true",
    } as NodeJS.ProcessEnv;
    jest.doMock("stripe", () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    const { stripe: mockStripe } = await import("../index.ts");
    expect(StripeCtor).not.toHaveBeenCalled();

    jest.resetModules();
    StripeCtor.mockClear();
    process.env = {
      ...OLD_ENV,
      STRIPE_USE_MOCK: "false",
    } as NodeJS.ProcessEnv;
    jest.doMock("stripe", () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_live" },
    }));

    const { stripe: realStripe } = await import("../index.ts");
    expect(StripeCtor).toHaveBeenCalledWith("sk_live", expect.any(Object));
    expect(realStripe).not.toBe(mockStripe);
    expect((realStripe as unknown as { key: string }).key).toBe("sk_live");
  });
});
