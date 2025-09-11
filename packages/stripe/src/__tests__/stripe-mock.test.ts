/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-mock.test.ts

describe("stripe mock", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "true" } as NodeJS.ProcessEnv;
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it("returns mock session and logs call", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    const { stripe } = await import("../index.ts");

    const session = await stripe.checkout.sessions.create({} as any);

    expect(session).toMatchObject({
      id: "cs_test_mock",
      url: "https://example.com/mock-session",
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[stripe-mock] checkout.sessions.create",
      expect.anything(),
    );
  });
});

