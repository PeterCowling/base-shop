import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { resetShippingEnv, setShippingEnv } from "./shipping.test-helpers";

const getLoader = async () => {
  jest.resetModules();
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("ALLOWED_COUNTRIES parsing", () => {
  it("parses and normalizes list", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "us, ca ,de" });
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
  });

  it("handles trailing commas", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "us, ca, " });
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA"]);
  });

  it("returns undefined for empty string", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "" });
    expect(env.ALLOWED_COUNTRIES).toBeUndefined();
  });

  it("eagerly parses from process.env", async () => {
    setShippingEnv({ ALLOWED_COUNTRIES: "us, ca ,de" } as NodeJS.ProcessEnv);
    const { shippingEnv } = await import("../shipping.ts");
    expect(shippingEnv.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
  });

  it("throws on non-string ALLOWED_COUNTRIES", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ ALLOWED_COUNTRIES: 123 as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
