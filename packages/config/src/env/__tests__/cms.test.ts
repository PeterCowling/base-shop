import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    });
  });

  it("uses defaults in development when variables are missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_SPACE_URL;
    delete process.env.CMS_ACCESS_TOKEN;
    delete process.env.SANITY_API_VERSION;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "placeholder-token",
      SANITY_API_VERSION: "2021-10-21",
    });
  });

    it("fails when CMS_SPACE_URL is invalid in development", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "development",
        CMS_SPACE_URL: "not-a-url",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../cms.ts")).rejects.toThrow(
        "Invalid CMS environment variables"
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          CMS_SPACE_URL: { _errors: [expect.any(String)] },
        })
      );
      errorSpy.mockRestore();
    });

  it("fails when SANITY_API_VERSION is not a string in development", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: 123 as any,
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      })
    );
    errorSpy.mockRestore();
  });


  it("throws when CMS_SPACE_URL is missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_SPACE_URL;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: [expect.any(String)] }, _errors: [] }
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("throws when CMS_ACCESS_TOKEN is missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_ACCESS_TOKEN;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] }, _errors: [] }
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("throws when SANITY_API_VERSION is missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    delete process.env.SANITY_API_VERSION;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { SANITY_API_VERSION: { _errors: [expect.any(String)] }, _errors: [] }
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("throws when CMS_SPACE_URL and CMS_ACCESS_TOKEN are missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_SPACE_URL;
    delete process.env.CMS_ACCESS_TOKEN;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: [expect.any(String)] },
        CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] },
      })
    );
    errorSpy.mockRestore();
  });

  it("throws when SANITY_API_VERSION is not a string in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: 123 as any,
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      })
    );
    errorSpy.mockRestore();
  });

  it("throws when CMS_SPACE_URL is malformed in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: [expect.any(String)] }, _errors: [] }
    );
    errorSpy.mockRestore();
  });

  it("throws when CMS_SPACE_URL is malformed and tokens are missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_ACCESS_TOKEN;
    delete process.env.SANITY_API_VERSION;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: [expect.any(String)] },
        CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] },
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      })
    );
    errorSpy.mockRestore();
  });

  it("throws on malformed configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: 123 as unknown as string,
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: [expect.any(String)] },
        CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] },
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      })
    );
    errorSpy.mockRestore();
  });

  it("fails safeParse when CMS_SPACE_URL is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");

    const parsed = cmsEnvSchema.safeParse({
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    });

    expect(parsed.success).toBe(false);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      if (!parsed.success) {
        console.error(
          "❌ Invalid CMS environment variables:",
          parsed.error.format(),
        );
        throw new Error("Invalid CMS environment variables");
      }
    }).toThrow("Invalid CMS environment variables");

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: [expect.any(String)] }, _errors: [] },
    );
    errorSpy.mockRestore();
  });

  it("fails safeParse when CMS_SPACE_URL is invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");

    const parsed = cmsEnvSchema.safeParse({
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    });

    expect(parsed.success).toBe(false);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      if (!parsed.success) {
        console.error(
          "❌ Invalid CMS environment variables:",
          parsed.error.format(),
        );
        throw new Error("Invalid CMS environment variables");
      }
    }).toThrow("Invalid CMS environment variables");

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: [expect.any(String)] }, _errors: [] },
    );
    errorSpy.mockRestore();
  });
});
