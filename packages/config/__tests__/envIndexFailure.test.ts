import { expect } from "@jest/globals";
import { z } from "zod";

// Mock env modules to expose schemas without validating process.env.
jest.mock("../src/env/cms.impl", () => ({
  cmsEnvSchema: z.object({
    CMS_SPACE_URL: z.string().url(),
    CMS_ACCESS_TOKEN: z.string().min(1),
    SANITY_API_VERSION: z.string().min(1),
  }),
}));

jest.mock("../src/env/core.impl", () => ({
  coreEnvBaseSchema: z.object({
    CMS_SPACE_URL: z.string().url(),
    CMS_ACCESS_TOKEN: z.string().min(1),
    SANITY_API_VERSION: z.string().min(1),
  }),
  depositReleaseEnvRefinement: () => {},
}));

jest.mock("../src/env/payments.impl", () => ({
  paymentEnvSchema: z.object({
    STRIPE_SECRET_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
  }),
}));

jest.mock("../src/env/shipping.impl", () => ({
  shippingEnvSchema: z.object({
    TAXJAR_KEY: z.string(),
  }),
}));

// Ensure the merged env schema logs and throws when invalid variables are provided.
describe("env index failure", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("throws and logs on invalid environment variables", async () => {
    process.env = {
      ...OLD_ENV,
      // core
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: "",
      // payment
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      // shipping
      TAXJAR_KEY: 123 as unknown as string,
    } as unknown as NodeJS.ProcessEnv;

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(import("../src/env/index")).rejects.toThrow(
      "Invalid environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
  });
});

