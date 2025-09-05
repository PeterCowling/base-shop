/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

describe("shipping env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  /**
   * Temporarily sets process.env for the duration of the callback.
   * The modules are reset so env is re-read on each invocation.
   */
  const withEnv = async (
    env: NodeJS.ProcessEnv,
    run: (load: () => any) => unknown,
  ) => {
    const { loadShippingEnv } = await import("../shipping.ts");
    return run(() => loadShippingEnv(env));
  };

  it("imports shipping.ts without error when env is valid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { shippingEnv } = await import("../shipping.ts");
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { shippingEnv } = await import("../shipping.ts");
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
  });

  it("loadShippingEnv parses valid variables", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups", DHL_KEY: "dhl" });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loadShippingEnv parses empty variables", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadShippingEnv({});
    expect(env).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws on invalid variables", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws on non-string TAXJAR_KEY", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ TAXJAR_KEY: 123 as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        TAXJAR_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws on non-string values", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ TAXJAR_KEY: 1 as any, UPS_KEY: 2 as any }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        TAXJAR_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws on non-string DHL_KEY", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ DHL_KEY: 123 as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws on invalid UPS_KEY", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws when process.env has invalid variables", async () => {
    // import with a valid env so the eager parse doesn't throw
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { loadShippingEnv } = await import("../shipping.ts");
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => loadShippingEnv()).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws on invalid configuration during eager parse", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when process.env has invalid DHL_KEY before import", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DHL_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws on invalid TAXJAR_KEY during eager parse", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        TAXJAR_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv logs and throws on numeric UPS_KEY", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => loadShippingEnv({ UPS_KEY: 123 } as any)).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("logs and throws during eager parse when UPS_KEY is non-string", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws during eager parse when process.env mixes valid and invalid keys", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: "tax",
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv reports all invalid keys when mixed with valid ones", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({
        TAXJAR_KEY: "tax",
        UPS_KEY: 123 as unknown as string,
        DHL_KEY: 456 as unknown as string,
      }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws when UPS_KEY is not a string", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadShippingEnv({ UPS_KEY: 123 as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws during eager parse when UPS_KEY is non-string", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as any,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("eager parse succeeds with valid env", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { shippingEnv } = await import("../shipping.ts");
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loadShippingEnv returns env for valid input", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups", DHL_KEY: "dhl" });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loadShippingEnv logs error for invalid input", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadShippingEnv({ UPS_KEY: 123 as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws and logs when DHL_KEY is null", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadShippingEnv({ DHL_KEY: null as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws during eager parse when DHL_KEY is null", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DHL_KEY: null as any,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv fails when UPS/DHL keys are malformed", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as any, DHL_KEY: 456 as any }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws during eager parse with invalid UPS/DHL env", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as any,
      DHL_KEY: 456 as any,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv throws when process.env has invalid TAXJAR_KEY", async () => {
    // import with a valid env so the eager parse doesn't throw
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { loadShippingEnv } = await import("../shipping.ts");
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => loadShippingEnv()).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        TAXJAR_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws during eager parse when UPS_KEY is invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loadShippingEnv returns object when variables are valid", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadShippingEnv({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
    expect(env).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups", DHL_KEY: "dhl" });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loadShippingEnv logs and throws on numeric UPS_KEY", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadShippingEnv({ UPS_KEY: 123 as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("eager parse fails when DHL_KEY is null", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      DHL_KEY: null as any,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("includes carriers when env vars are set", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const env = loadShippingEnv({
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual({ UPS_KEY: "ups", DHL_KEY: "dhl" });
  });

  it("omits carriers when env vars are missing", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const env = loadShippingEnv({} as NodeJS.ProcessEnv);
    expect(env).toEqual({});
    expect(env).not.toHaveProperty("UPS_KEY");
    expect(env).not.toHaveProperty("DHL_KEY");
  });

  it("throws when a carrier env var is invalid", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as unknown as string }),
    ).toThrow("Invalid shipping environment variables");
  });

  it("defaults carrier keys to undefined when optional vars are absent", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const env = loadShippingEnv({} as NodeJS.ProcessEnv);
    expect(env.UPS_KEY).toBeUndefined();
    expect(env.DHL_KEY).toBeUndefined();
  });

  describe("DEFAULT_SHIPPING_ZONE selection", () => {
    it("returns domestic flag when set to domestic", async () => {
      const { loadShippingEnv } = await import("../shipping.ts");
      const env = loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "domestic" });
      expect(env.DEFAULT_SHIPPING_ZONE).toBe("domestic");
    });

    it("returns eu flag when set to eu", async () => {
      const { loadShippingEnv } = await import("../shipping.ts");
      const env = loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "eu" });
      expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
    });

    it("returns international flag when set to international", async () => {
      const { loadShippingEnv } = await import("../shipping.ts");
      const env = loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "international" });
      expect(env.DEFAULT_SHIPPING_ZONE).toBe("international");
    });

    it("defaults to domestic when unset", async () => {
      const { loadShippingEnv } = await import("../shipping.ts");
      const env = loadShippingEnv({});
      const zone = env.DEFAULT_SHIPPING_ZONE ?? "domestic";
      expect(zone).toBe("domestic");
    });
  });

  it("throws on invalid DEFAULT_SHIPPING_ZONE", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({
        DEFAULT_SHIPPING_ZONE: "mars" as unknown as "domestic",
      }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DEFAULT_SHIPPING_ZONE: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("applies FREE_SHIPPING_THRESHOLD correctly", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const env = loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "50" });
    const qualifies = (amount: number) =>
      env.FREE_SHIPPING_THRESHOLD !== undefined &&
      amount >= env.FREE_SHIPPING_THRESHOLD;
    expect(qualifies(49)).toBe(false);
    expect(qualifies(50)).toBe(true);
    expect(qualifies(51)).toBe(true);
  });

  it("handles missing and invalid FREE_SHIPPING_THRESHOLD", async () => {
    const { loadShippingEnv } = await import("../shipping.ts");
    const env = loadShippingEnv({});
    const qualifies = (amount: number) =>
      env.FREE_SHIPPING_THRESHOLD !== undefined &&
      amount >= env.FREE_SHIPPING_THRESHOLD;
    expect(env.FREE_SHIPPING_THRESHOLD).toBeUndefined();
    expect(qualifies(100)).toBe(false);

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" as any }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        FREE_SHIPPING_THRESHOLD: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  describe("withEnv helper", () => {
    describe.each([
      ["domestic", "domestic"],
      ["eu", "eu"],
      ["international", "international"],
      [undefined, "domestic"],
    ])("DEFAULT_SHIPPING_ZONE = %s", (zone, expected) => {
      it(`returns ${expected}`, async () => {
        await withEnv(
          zone ? { DEFAULT_SHIPPING_ZONE: zone } : {},
          (load) => {
            const env = load();
            expect(env.DEFAULT_SHIPPING_ZONE ?? "domestic").toBe(expected);
          },
        );
      });
    });

    it("applies FREE_SHIPPING_THRESHOLD around the limit", async () => {
      await withEnv({ FREE_SHIPPING_THRESHOLD: "75" }, (load) => {
        const env = load();
        const qualifies = (amount: number) =>
          env.FREE_SHIPPING_THRESHOLD !== undefined &&
          amount >= env.FREE_SHIPPING_THRESHOLD;
        expect(qualifies(74)).toBe(false);
        expect(qualifies(75)).toBe(true);
        expect(qualifies(76)).toBe(true);
      });
    });

    it.each([
      [{ UPS_KEY: 123 as any }, "UPS_KEY"],
      [{ DHL_KEY: 456 as any }, "DHL_KEY"],
      [{ FREE_SHIPPING_THRESHOLD: "abc" }, "FREE_SHIPPING_THRESHOLD"],
      [{ DEFAULT_SHIPPING_ZONE: "mars" as any }, "DEFAULT_SHIPPING_ZONE"],
    ])("throws on malformed %s", async (envVars, key) => {
      await withEnv(envVars as any, (load) => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() => load()).toThrow(
          "Invalid shipping environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid shipping environment variables:",
          expect.objectContaining({ [key]: { _errors: expect.arrayContaining([expect.any(String)]) } }),
        );
        errorSpy.mockRestore();
      });
    });
  });
});

