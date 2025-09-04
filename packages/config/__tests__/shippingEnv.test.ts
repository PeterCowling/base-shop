import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("shippingEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("legacy parse returns parsed env when keys are valid strings", async () => {
    const { shippingEnv } = await withEnv(
      {
        TAXJAR_KEY: "tax",
        UPS_KEY: "ups",
        DHL_KEY: "dhl",
      },
      () => import("../src/env/shipping"),
    );
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
  });

  it("throws and logs when a key has an invalid type", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          TAXJAR_KEY: "tax",
          UPS_KEY: "ups",
          // @ts-expect-error - intentionally invalid type to trigger schema failure
          DHL_KEY: 123,
        } as unknown as NodeJS.ProcessEnv,
        () => import("../src/env/shipping"),
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("loadShippingEnv parses valid keys", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
  });

  it("loadShippingEnv throws and logs on invalid UPS_KEY", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as any } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("legacy parse throws and logs on invalid UPS_KEY", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          UPS_KEY: 123 as any,
        } as unknown as NodeJS.ProcessEnv,
        () => import("../src/env/shipping"),
      ),
    ).rejects.toThrow("Invalid shipping environment variables");
    expect(spy).toHaveBeenCalled();
  });
});

