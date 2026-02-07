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

  it("transforms ALLOWED_COUNTRIES to uppercase array", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      ALLOWED_COUNTRIES: "us, ca , de",
    } as NodeJS.ProcessEnv);
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
  });

  it("treats empty ALLOWED_COUNTRIES as undefined", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      ALLOWED_COUNTRIES: "",
    } as NodeJS.ProcessEnv);
    expect(env.ALLOWED_COUNTRIES).toBeUndefined();
  });

  it("treats undefined ALLOWED_COUNTRIES as undefined", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({} as NodeJS.ProcessEnv);
    expect(env.ALLOWED_COUNTRIES).toBeUndefined();
  });

  it("parses truthy and falsy LOCAL_PICKUP_ENABLED", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    expect(
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "true" } as NodeJS.ProcessEnv)
        .LOCAL_PICKUP_ENABLED,
    ).toBe(true);
    expect(
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "1" } as NodeJS.ProcessEnv)
        .LOCAL_PICKUP_ENABLED,
    ).toBe(true);
    expect(
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "false" } as NodeJS.ProcessEnv)
        .LOCAL_PICKUP_ENABLED,
    ).toBe(false);
    expect(
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "0" } as NodeJS.ProcessEnv)
        .LOCAL_PICKUP_ENABLED,
    ).toBe(false);
  });

  it("parses 'no' as false", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      LOCAL_PICKUP_ENABLED: "no",
    } as NodeJS.ProcessEnv);
    expect(env.LOCAL_PICKUP_ENABLED).toBe(false);
  });

  it("throws on invalid LOCAL_PICKUP_ENABLED value", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ LOCAL_PICKUP_ENABLED: "maybe" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    const [[, err]] = spy.mock.calls;
    expect(err.LOCAL_PICKUP_ENABLED._errors).toContain("must be a boolean");
  });

  it("accepts 2-letter DEFAULT_COUNTRY codes", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      DEFAULT_COUNTRY: " us ",
    } as NodeJS.ProcessEnv);
    expect(env.DEFAULT_COUNTRY).toBe("US");
  });

  it("rejects invalid DEFAULT_COUNTRY codes", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ DEFAULT_COUNTRY: "USA" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    const [[, err1]] = spy.mock.calls;
    expect(err1.DEFAULT_COUNTRY._errors).toContain(
      "must be a 2-letter country code",
    );
  });

  it("rejects non-alpha DEFAULT_COUNTRY codes", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ DEFAULT_COUNTRY: "1A" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    const [[, err2]] = spy.mock.calls;
    expect(err2.DEFAULT_COUNTRY._errors).toContain(
      "must be a 2-letter country code",
    );
  });

  it("requires UPS_KEY when SHIPPING_PROVIDER=ups", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ SHIPPING_PROVIDER: "ups" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    const [[, err]] = spy.mock.calls;
    expect(err.UPS_KEY._errors).toContain(
      "UPS_KEY is required when SHIPPING_PROVIDER=ups",
    );
  });

  it("requires DHL_KEY when SHIPPING_PROVIDER=dhl", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ SHIPPING_PROVIDER: "dhl" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    const [[, err]] = spy.mock.calls;
    expect(err.DHL_KEY._errors).toContain(
      "DHL_KEY is required when SHIPPING_PROVIDER=dhl",
    );
  });

  it("loadShippingEnv returns parsed data for valid config", async () => {
    const { loadShippingEnv } = await import("../src/env/shipping");
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      SHIPPING_PROVIDER: "ups",
      UPS_KEY: "upsk",
      ALLOWED_COUNTRIES: "us,ca",
      LOCAL_PICKUP_ENABLED: "true",
      DEFAULT_COUNTRY: "us",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual({
      TAXJAR_KEY: "tax",
      SHIPPING_PROVIDER: "ups",
      UPS_KEY: "upsk",
      ALLOWED_COUNTRIES: ["US", "CA"],
      LOCAL_PICKUP_ENABLED: true,
      DEFAULT_COUNTRY: "US",
    });
  });
});
