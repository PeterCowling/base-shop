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

  it("defaults NEXTAUTH_SECRET in development when missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "dev-nextauth-secret",
      SESSION_SECRET: "session-secret",
    });
  });

  it("defaults SESSION_SECRET in development when missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: "next-secret",
    } as NodeJS.ProcessEnv;
    delete process.env.SESSION_SECRET;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "dev-session-secret",
    });
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

  it("throws when SESSION_SECRET is missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
    } as NodeJS.ProcessEnv;
    delete process.env.SESSION_SECRET;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_SECRET: { _errors: [expect.any(String)] },
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
      UPSTASH_REDIS_REST_URL: {
        _errors: [
          "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        ],
      },
      UPSTASH_REDIS_REST_TOKEN: {
        _errors: [
          "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        ],
      },
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
      LOGIN_RATE_LIMIT_REDIS_TOKEN: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        ],
      },
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
      LOGIN_RATE_LIMIT_REDIS_URL: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        ],
      },
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
          LOGIN_RATE_LIMIT_REDIS_URL: {
            _errors: [
              "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
            ],
          },
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
          LOGIN_RATE_LIMIT_REDIS_TOKEN: {
            _errors: [
              "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
            ],
          },
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

  it("parses redis session store configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
  });

  it("throws when LOGIN_RATE_LIMIT_REDIS_URL is invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url",
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
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
      }),
    );
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
      UPSTASH_REDIS_REST_URL: {
        _errors: [
          "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        ],
      },
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
      UPSTASH_REDIS_REST_TOKEN: {
        _errors: [
          "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        ],
      },
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
      LOGIN_RATE_LIMIT_REDIS_TOKEN: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        ],
      },
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
      LOGIN_RATE_LIMIT_REDIS_URL: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        ],
      },
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

describe("auth providers and tokens", () => {
  const ORIGINAL_ENV = { ...process.env, AUTH_TOKEN_TTL: "15m" } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    process.env = { ...ORIGINAL_ENV, AUTH_TOKEN_TTL: "15m" } as NodeJS.ProcessEnv;
  });

  const baseEnv = {
    NEXTAUTH_SECRET: "next-secret",
    SESSION_SECRET: "session-secret",
  } as const;

  const withEnv = async (
    env: Record<string, string | undefined>,
    fn: () => Promise<void> | void,
  ) => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
      ...env,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    await fn();
  };

  it("parses local provider without extra secrets", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    await withEnv({ AUTH_PROVIDER: "local" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.AUTH_PROVIDER).toBe("local");
      expect(authEnv.JWT_SECRET).toBeUndefined();
      expect(authEnv.OAUTH_CLIENT_ID).toBeUndefined();
      expect(authEnv.OAUTH_CLIENT_SECRET).toBeUndefined();
      expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
      expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
        "2020-01-01T00:15:00.000Z",
      );
      expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
      expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
      expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
      expect(authEnv.ALLOW_GUEST).toBe(false);
      expect(authEnv.ENFORCE_2FA).toBe(false);
    });
  });

  it("parses jwt provider when secret present", async () => {
    await withEnv(
      { AUTH_PROVIDER: "jwt", JWT_SECRET: "jwt-secret" },
      async () => {
        const { authEnv } = await import("../auth.ts");
        expect(authEnv.JWT_SECRET).toBe("jwt-secret");
      },
    );
  });

  it("throws when JWT_SECRET missing", async () => {
    await withEnv({ AUTH_PROVIDER: "jwt" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("throws when JWT_SECRET empty", async () => {
    await withEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET: "" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("parses oauth provider with credentials", async () => {
    await withEnv(
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "id",
        OAUTH_CLIENT_SECRET: "secret",
      },
      async () => {
        const { authEnv } = await import("../auth.ts");
        expect(authEnv.OAUTH_CLIENT_ID).toBe("id");
        expect(authEnv.OAUTH_CLIENT_SECRET).toBe("secret");
      },
    );
  });

  it("throws when oauth credentials are missing", async () => {
    await withEnv({ AUTH_PROVIDER: "oauth" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_ID: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
          OAUTH_CLIENT_SECRET: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("throws when OAUTH_CLIENT_ID missing", async () => {
    await withEnv(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_SECRET: "secret" },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import("../auth.ts")).rejects.toThrow(
          "Invalid auth environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid auth environment variables:",
          expect.objectContaining({
            OAUTH_CLIENT_ID: {
              _errors: expect.arrayContaining([expect.any(String)]),
            },
          }),
        );
        errorSpy.mockRestore();
      },
    );
  });

  it("throws when OAUTH_CLIENT_SECRET missing", async () => {
    await withEnv({ AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "id" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_SECRET: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("throws when OAUTH_CLIENT_ID empty", async () => {
    await withEnv(
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "",
        OAUTH_CLIENT_SECRET: "secret",
      },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import("../auth.ts")).rejects.toThrow(
          "Invalid auth environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid auth environment variables:",
          expect.objectContaining({
            OAUTH_CLIENT_ID: {
              _errors: expect.arrayContaining([expect.any(String)]),
            },
          }),
        );
        errorSpy.mockRestore();
      },
    );
  });

  it("throws when OAUTH_CLIENT_SECRET empty", async () => {
    await withEnv(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "id", OAUTH_CLIENT_SECRET: "" },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import("../auth.ts")).rejects.toThrow(
          "Invalid auth environment variables",
        );
        expect(errorSpy).toHaveBeenCalledWith(
          "❌ Invalid auth environment variables:",
          expect.objectContaining({
            OAUTH_CLIENT_SECRET: {
              _errors: expect.arrayContaining([expect.any(String)]),
            },
          }),
        );
        errorSpy.mockRestore();
      },
    );
  });

  it("parses TTL in seconds", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    await withEnv({ AUTH_TOKEN_TTL: "60s" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
      expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
        "2020-01-01T00:01:00.000Z",
      );
    });
  });

  it("parses TTL in minutes", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    await withEnv({ AUTH_TOKEN_TTL: "15m" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
      expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
        "2020-01-01T00:15:00.000Z",
      );
    });
  });

  it("errors on malformed TTL string", async () => {
    await withEnv({ AUTH_TOKEN_TTL: "abc" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          AUTH_TOKEN_TTL: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });


  it("parses zero TTL", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    await withEnv({ AUTH_TOKEN_TTL: "0s" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(0);
      expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
        "2020-01-01T00:00:00.000Z",
      );
    });
  });

  it("errors on negative TTL input", async () => {
    await withEnv({ AUTH_TOKEN_TTL: "-5s" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          AUTH_TOKEN_TTL: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("allows HS256 algorithm", async () => {
    await withEnv({ TOKEN_ALGORITHM: "HS256" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
    });
  });

  it("allows RS256 algorithm", async () => {
    await withEnv({ TOKEN_ALGORITHM: "RS256" }, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.TOKEN_ALGORITHM).toBe("RS256");
    });
  });

  it("errors on unsupported algorithm", async () => {
    await withEnv({ TOKEN_ALGORITHM: "none" }, async () => {
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await expect(import("../auth.ts")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          TOKEN_ALGORITHM: {
            _errors: expect.arrayContaining([expect.any(String)]),
          },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  it("uses default token audience and issuer", async () => {
    await withEnv({}, async () => {
      const { authEnv } = await import("../auth.ts");
      expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
      expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
    });
  });

  it("overrides token audience and issuer", async () => {
    await withEnv(
      { TOKEN_AUDIENCE: "custom-aud", TOKEN_ISSUER: "custom-iss" },
      async () => {
        const { authEnv } = await import("../auth.ts");
        expect(authEnv.TOKEN_AUDIENCE).toBe("custom-aud");
        expect(authEnv.TOKEN_ISSUER).toBe("custom-iss");
      },
    );
  });

  it("parses boolean toggles", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
      ALLOW_GUEST: "true",
      ENFORCE_2FA: "true",
    } as NodeJS.ProcessEnv;
    const { authEnv } = await import("../auth.ts");
    expect(authEnv.ALLOW_GUEST).toBe(true);
    expect(authEnv.ENFORCE_2FA).toBe(true);
  });

  it("uses memory session store without redis config", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ...baseEnv,
      SESSION_STORE: "memory",
    } as NodeJS.ProcessEnv;
    const { authEnv } = await import("../auth.ts");
    expect(authEnv.SESSION_STORE).toBe("memory");
  });
});

