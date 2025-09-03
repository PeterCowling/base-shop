import { afterEach, describe, expect, it } from "@jest/globals";

describe("auth env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    });
  });

  it("defaults secrets in development", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.PREVIEW_TOKEN_SECRET;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "dev-nextauth-secret",
      SESSION_SECRET: "dev-session-secret",
    });
    expect(authEnv.PREVIEW_TOKEN_SECRET).toBeUndefined();
  });

  it("throws when secrets are empty in non-production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
        SESSION_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws on missing required configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SESSION_SECRET;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
        SESSION_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when NEXTAUTH_SECRET is missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when required secrets are empty", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
        SESSION_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("fails safeParse for missing required secrets", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
      SESSION_SECRET: { _errors: [expect.any(String)] },
    });
    expect(() => authEnvSchema.parse({})).toThrow();
  });

  it("throws when SESSION_STORE is invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "postgres",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_STORE: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when redis session store credentials are missing", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "redis",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    try {
      require("../auth.ts");
      throw new Error("Expected require to throw");
    } catch (err) {
      expect((err as Error).message).toBe("Invalid auth environment variables");
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_URL: { _errors: [expect.any(String)] },
          UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
        }),
      );
    }
    errorSpy.mockRestore();
  });

  it("returns errors when redis session store credentials missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "redis",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_URL: { _errors: [expect.any(String)] },
      UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
    });
  });

  describe("redis session store configuration", () => {
    it("throws when UPSTASH_REDIS_REST_URL is missing", () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "next-secret",
        SESSION_SECRET: "session-secret",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_TOKEN: "token",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      try {
        require("../auth.ts");
        throw new Error("Expected require to throw");
      } catch (err) {
        expect((err as Error).message).toBe(
          "Invalid auth environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid auth environment variables:",
          expect.objectContaining({
            UPSTASH_REDIS_REST_URL: { _errors: [expect.any(String)] },
          }),
        );
      }
      errorSpy.mockRestore();
    });

    it("throws when UPSTASH_REDIS_REST_TOKEN is missing", () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "next-secret",
        SESSION_SECRET: "session-secret",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      try {
        require("../auth.ts");
        throw new Error("Expected require to throw");
      } catch (err) {
        expect((err as Error).message).toBe(
          "Invalid auth environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid auth environment variables:",
          expect.objectContaining({
            UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
          }),
        );
      }
      errorSpy.mockRestore();
    });

    it("parses when redis session store credentials provided", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "next-secret",
        SESSION_SECRET: "session-secret",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: "token",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      const { authEnv } = await import("../auth.ts");
      expect(authEnv).toMatchObject({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: "token",
      });
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  it("returns error when LOGIN_RATE_LIMIT_REDIS_TOKEN missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: [expect.any(String)] },
    });
  });

  it("returns error when LOGIN_RATE_LIMIT_REDIS_URL missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
    });
  });

  it("parses rate limit redis configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it(
    "throws when LOGIN_RATE_LIMIT_REDIS_TOKEN is set without URL",
    () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "next-secret",
        SESSION_SECRET: "session-secret",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      try {
        require("../auth.ts");
        throw new Error("Expected require to throw");
      } catch (err) {
        expect((err as Error).message).toBe(
          "Invalid auth environment variables",
        );
      }
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
        }),
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    },
  );

  it(
    "throws when LOGIN_RATE_LIMIT_REDIS_URL is set without token",
    () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "next-secret",
        SESSION_SECRET: "session-secret",
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      try {
        require("../auth.ts");
        throw new Error("Expected require to throw");
      } catch (err) {
        expect((err as Error).message).toBe(
          "Invalid auth environment variables",
        );
      }
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: [expect.any(String)] },
        }),
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    },
  );

  it("throws when optional URLs are invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when optional URL is invalid and NEXTAUTH_SECRET is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("logs error when SESSION_STORE=redis without UPSTASH_REDIS_REST_URL", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_URL: {
          _errors: [
            "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("logs error when SESSION_STORE=redis without UPSTASH_REDIS_REST_TOKEN", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_TOKEN: {
          _errors: [
            "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_URL set without token", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: {
          _errors: [
            "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_TOKEN set without URL", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: {
          _errors: [
            "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("logs error for invalid auth secrets", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: {
          _errors: ["String must contain at least 1 character(s)"],
        },
        SESSION_SECRET: {
          _errors: ["String must contain at least 1 character(s)"],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

describe("authEnvSchema", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  const baseEnv = {
    NEXTAUTH_SECRET: "next-secret",
    SESSION_SECRET: "session-secret",
  } as const;

  it("errors when redis session store URL is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_URL: { _errors: [expect.any(String)] },
    });
  });

  it("errors when redis session store token is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
    });
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_URL is set without token", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: [expect.any(String)] },
    });
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_TOKEN is set without URL", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
    });
  });

  it("parses valid redis configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    const { authEnvSchema } = await import("../auth.ts");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: "token",
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    });
    expect(result.success).toBe(true);
  });
});

