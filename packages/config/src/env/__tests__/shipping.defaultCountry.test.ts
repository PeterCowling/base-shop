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

describe("DEFAULT_COUNTRY parsing", () => {
  it("is undefined when unset", async () => {
    const load = await getLoader();
    const env = load({});
    expect(env.DEFAULT_COUNTRY).toBeUndefined();
  });

  it("normalizes when set", async () => {
    const load = await getLoader();
    const env = load({ DEFAULT_COUNTRY: "us" });
    expect(env.DEFAULT_COUNTRY).toBe("US");
  });

  it("trims and uppercases", async () => {
    const load = await getLoader();
    const env = load({ DEFAULT_COUNTRY: " gb " });
    expect(env.DEFAULT_COUNTRY).toBe("GB");
  });

  it.each(["USA", "123", "gbr"])('throws on invalid code %s', async (val) => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ DEFAULT_COUNTRY: val as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws eagerly when invalid DEFAULT_COUNTRY in process.env", async () => {
    setShippingEnv({ DEFAULT_COUNTRY: "USA" } as NodeJS.ProcessEnv);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
