/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-init.test.ts

describe("stripe client initialization", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it("throws when STRIPE_SECRET_KEY is undefined", async () => {
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    await expect(import("../index.ts")).rejects.toThrow(
      "Neither apiKey nor config.authenticator provided",
    );
  });

  it("creates client with fetch http client and api version", async () => {
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
});
