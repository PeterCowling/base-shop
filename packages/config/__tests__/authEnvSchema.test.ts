import { describe, expect, it } from "@jest/globals";

import { authEnvSchema } from "../src/env/auth";

const parse = (env: Record<string, any>) => authEnvSchema.safeParse(env);

describe("authEnvSchema.safeParse", () => {
  it("rejects numeric AUTH_TOKEN_TTL values", () => {
    const result = parse({ AUTH_TOKEN_TTL: 60 });
    expect(result.success).toBe(false);
    expect(result.error.format().AUTH_TOKEN_TTL?._errors).toContain(
      "AUTH_TOKEN_TTL must be a string like '60s' or '15m'",
    );
  });

  it("errors for invalid AUTH_TOKEN_TTL strings", () => {
    const result = parse({ AUTH_TOKEN_TTL: "xyz" });
    expect(result.success).toBe(false);
    expect(result.error.format().AUTH_TOKEN_TTL?._errors).toContain(
      "AUTH_TOKEN_TTL must be a string like '60s' or '15m'",
    );
  });

  it("validates NEXTAUTH_SECRET length", () => {
    const result = parse({ NEXTAUTH_SECRET: "short" });
    expect(result.success).toBe(false);
    expect(result.error.format().NEXTAUTH_SECRET?._errors).toContain(
      "must be at least 32 characters",
    );
  });

  it("validates NEXTAUTH_SECRET printable characters", () => {
    const result = parse({ NEXTAUTH_SECRET: `${"a".repeat(31)}\n` });
    expect(result.success).toBe(false);
    expect(result.error.format().NEXTAUTH_SECRET?._errors).toContain(
      "must contain only printable ASCII characters",
    );
  });

  it("requires redis url and token when SESSION_STORE=redis", () => {
    const result = parse({ SESSION_STORE: "redis" });
    expect(result.success).toBe(false);
    const formatted = result.error.format();
    expect(formatted.UPSTASH_REDIS_REST_URL?._errors).toContain(
      "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
    );
    expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors).toContain(
      "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
    );
  });

  it("requires LOGIN_RATE_LIMIT_REDIS_TOKEN when only url provided", () => {
    const result = parse({ LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com" });
    expect(result.success).toBe(false);
    expect(
      result.error.format().LOGIN_RATE_LIMIT_REDIS_TOKEN?._errors,
    ).toContain(
      "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
    );
  });

  it("requires LOGIN_RATE_LIMIT_REDIS_URL when only token provided", () => {
    const result = parse({ LOGIN_RATE_LIMIT_REDIS_TOKEN: "a".repeat(32) });
    expect(result.success).toBe(false);
    expect(
      result.error.format().LOGIN_RATE_LIMIT_REDIS_URL?._errors,
    ).toContain(
      "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
    );
  });

  it("requires JWT_SECRET for jwt provider", () => {
    const result = parse({ AUTH_PROVIDER: "jwt" });
    expect(result.success).toBe(false);
    expect(result.error.format().JWT_SECRET?._errors).toContain(
      "JWT_SECRET is required when AUTH_PROVIDER=jwt",
    );
  });

  it("requires OAuth credentials for oauth provider", () => {
    const result = parse({ AUTH_PROVIDER: "oauth" });
    expect(result.success).toBe(false);
    const formatted = result.error.format();
    expect(formatted.OAUTH_ISSUER?._errors).toContain(
      "OAUTH_ISSUER is required when AUTH_PROVIDER=oauth",
    );
    expect(formatted.OAUTH_CLIENT_ID?._errors).toContain(
      "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
    );
    expect(formatted.OAUTH_CLIENT_SECRET?._errors).toContain(
      "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
    );
    expect(formatted.OAUTH_REDIRECT_ORIGIN?._errors).toContain(
      "OAUTH_REDIRECT_ORIGIN is required when AUTH_PROVIDER=oauth",
    );
  });
});
