import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { resetShippingEnv } from "./shipping.test-helpers";

const getLoader = async () => {
  jest.resetModules();
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("LOCAL_PICKUP_ENABLED parsing", () => {
  const cases: Array<[string, boolean]> = [
    ["true", true],
    ["false", false],
    ["TRUE", true],
    ["FALSE", false],
    ["1", true],
    ["0", false],
    ["yes", true],
  ];

  it.each(cases)("parses %s", async (input, expected) => {
    const load = await getLoader();
    const env = load({ LOCAL_PICKUP_ENABLED: input });
    expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
  });

  it("is undefined when not set", async () => {
    const load = await getLoader();
    const env = load({});
    expect(env.LOCAL_PICKUP_ENABLED).toBeUndefined();
  });

  it("throws on invalid values", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ LOCAL_PICKUP_ENABLED: "maybe" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
