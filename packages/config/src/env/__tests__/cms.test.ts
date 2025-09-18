/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

describe("cms env module", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
  } as NodeJS.ProcessEnv;

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
          CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
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
        SANITY_API_VERSION: { _errors: expect.arrayContaining([expect.any(String)]) },
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
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] }
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
      { CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] }
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("defaults SANITY_API_VERSION when missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    delete process.env.SANITY_API_VERSION;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_API_VERSION).toBe("2021-10-21");
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
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
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
        SANITY_API_VERSION: { _errors: expect.arrayContaining([expect.any(String)]) },
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
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] }
    );
    errorSpy.mockRestore();
  });

  it("logs and throws when CMS_SPACE_URL is invalid in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "invalid-url",
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
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] }
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);

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
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
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
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
        SANITY_API_VERSION: { _errors: expect.arrayContaining([expect.any(String)]) },
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
      SANITY_API_TOKEN: "token",
      SANITY_PROJECT_ID: "test-project",
      SANITY_DATASET: "production",
      SANITY_PREVIEW_SECRET: "preview-secret",
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
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] },
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
      SANITY_API_TOKEN: "token",
      SANITY_PROJECT_ID: "test-project",
      SANITY_DATASET: "production",
      SANITY_PREVIEW_SECRET: "preview-secret",
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
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] },
    );
    errorSpy.mockRestore();
  });

  it("throws when required with an invalid CMS_SPACE_URL in production", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();

    const req = createRequire(__filename);
    expect(() => req("../cms.ts")).toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  describe("CMS_BASE_URL", () => {
    it("strips trailing slashes from valid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "https://cms.example.com/",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
    });

    it("accepts valid URLs without modification", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "https://cms.example.com",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
    });

    it("rejects invalid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "not-a-url",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../cms.ts")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          CMS_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe("SANITY_BASE_URL", () => {
    it("strips trailing slashes", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_BASE_URL: "https://sanity.example.com/",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
    });

    it("rejects invalid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_BASE_URL: "not-a-url",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../cms.ts")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          SANITY_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe("CMS_PAGINATION_LIMIT", () => {
    it("defaults to 100 when unset", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(100);
    });

    it("respects overrides", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_PAGINATION_LIMIT: "25",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(25);
    });
  });

  describe("CMS feature flags", () => {
    it("are disabled by default with empty path lists", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(false);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
    });

    it("parse overrides and disabled-path lists", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_DRAFTS_ENABLED: "true",
        CMS_DRAFTS_DISABLED_PATHS: "/draft1,/draft2",
        CMS_SEARCH_ENABLED: "true",
        CMS_SEARCH_DISABLED_PATHS: "/search1",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([
        "/draft1",
        "/draft2",
      ]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(true);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1"]);
    });

    it("respect disabled path lists when features are explicitly off", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_DRAFTS_ENABLED: "",
        CMS_DRAFTS_DISABLED_PATHS: "/draft1, /draft2 ,",
        CMS_SEARCH_ENABLED: "",
        CMS_SEARCH_DISABLED_PATHS: "/search1, /search2,",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(["/draft1", "/draft2"]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(false);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1", "/search2"]);
    });
  });
});
