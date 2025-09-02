import { afterEach, describe, expect, it } from "@jest/globals";

describe("shipping env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
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
        UPS_KEY: { _errors: [expect.any(String)] },
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
        TAXJAR_KEY: { _errors: [expect.any(String)] },
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
        TAXJAR_KEY: { _errors: [expect.any(String)] },
        UPS_KEY: { _errors: [expect.any(String)] },
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
        DHL_KEY: { _errors: [expect.any(String)] },
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
        UPS_KEY: { _errors: [expect.any(String)] },
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
        UPS_KEY: { _errors: [expect.any(String)] },
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
        UPS_KEY: { _errors: [expect.any(String)] },
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
        DHL_KEY: { _errors: [expect.any(String)] },
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
        TAXJAR_KEY: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });
});

