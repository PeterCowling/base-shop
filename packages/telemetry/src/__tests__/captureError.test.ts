// packages/telemetry/src/__tests__/captureError.test.ts
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { sanitizeContext } from "../sanitize";

/**
 * NOTE: The telemetry module evaluates ENABLED at module load time.
 * We use jest.resetModules() and dynamic imports to test with different env configurations.
 */

describe("captureError", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Enable telemetry for tests
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_TELEMETRY: "true",
      FORCE_TELEMETRY: "true", // Required since NODE_ENV isn't "production"
      NODE_ENV: "test",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("normalizes string to Error info", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    captureError("string error");

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].name).toBe("error.captured");
    expect(__buffer[0].payload?.error).toBe("string error");
  });

  it("normalizes number to Error info", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    captureError(404);

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].payload?.error).toBe("404");
  });

  it("extracts Error instance properties", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    const error = new Error("Test error");
    captureError(error);

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].name).toBe("error.captured");
    expect(__buffer[0].payload?.message).toBe("Test error");
    // Note: error.name is stripped by stripPII since "name" matches the PII regex
    // This is intentional behavior - the event name "error.captured" identifies the error type
  });

  it("includes stack preview for Error instances", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    const error = new Error("Test error");
    captureError(error);

    expect(__buffer[0].payload?.stackPreview).toBeDefined();
    expect(__buffer[0].payload?.stackPreview).toContain("Error: Test error");
  });

  it("includes context fields in payload", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    const error = new Error("Test error");
    captureError(error, {
      scope: "test-scope",
      event: "test-event",
      metadata: { foo: "bar" },
    });

    expect(__buffer[0].payload?.scope).toBe("test-scope");
    expect(__buffer[0].payload?.event).toBe("test-event");
    expect(__buffer[0].payload?.metadata).toEqual({ foo: "bar" });
  });

  it("sets default scope to 'unknown'", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    captureError(new Error("test"));

    expect(__buffer[0].payload?.scope).toBe("unknown");
  });

  it("sets default event to 'error'", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    captureError(new Error("test"));

    expect(__buffer[0].payload?.event).toBe("error");
  });

  it("respects ENABLED flag (disabled)", async () => {
    // Reset and disable telemetry
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_TELEMETRY: "false",
      NODE_ENV: "test",
    };

    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    captureError(new Error("test"));

    expect(__buffer).toHaveLength(0);
  });

  it("sets timestamp", async () => {
    const { captureError, __buffer } = await import("../index");
    __buffer.length = 0;

    const before = Date.now();
    captureError(new Error("test"));
    const after = Date.now();

    expect(__buffer[0].ts).toBeGreaterThanOrEqual(before);
    expect(__buffer[0].ts).toBeLessThanOrEqual(after);
  });
});

describe("sanitizeContext", () => {
  it("allows safe fields", () => {
    const context = {
      app: "test-app",
      env: "production",
      requestId: "req-123",
      shopId: "shop-456",
      url: "https://example.com",
    };

    const sanitized = sanitizeContext(context);

    expect(sanitized.app).toBe("test-app");
    expect(sanitized.env).toBe("production");
    expect(sanitized.requestId).toBe("req-123");
    expect(sanitized.shopId).toBe("shop-456");
    expect(sanitized.url).toBe("https://example.com");
  });

  it("strips PII fields", () => {
    const context = {
      app: "test-app",
      email: "user@example.com",
      password: "secret123",
      name: "John Doe",
      creditCard: "1234-5678-9012-3456",
    };

    const sanitized = sanitizeContext(context);

    expect(sanitized.app).toBe("test-app");
    expect(sanitized.email).toBeUndefined();
    expect(sanitized.password).toBeUndefined();
    expect(sanitized.name).toBeUndefined();
    expect(sanitized.creditCard).toBeUndefined();
  });

  it("truncates long strings", () => {
    const longString = "a".repeat(2000);
    const context = {
      app: "test",
      url: longString,
    };

    const sanitized = sanitizeContext(context);

    expect((sanitized.url as string).length).toBe(1014); // 1000 + "...[truncated]"
    expect(sanitized.url).toContain("...[truncated]");
  });

  it("hashes sensitive IDs", () => {
    const context = {
      userId: "user-12345",
      sessionId: "session-67890",
    };

    const sanitized = sanitizeContext(context);

    expect(sanitized.userId).not.toBe("user-12345");
    expect((sanitized.userId as string).startsWith("hash_")).toBe(true);
    expect(sanitized.sessionId).not.toBe("session-67890");
    expect((sanitized.sessionId as string).startsWith("hash_")).toBe(true);
  });

  it("handles undefined context", () => {
    const sanitized = sanitizeContext(undefined);

    expect(sanitized).toEqual({});
  });

  it("handles empty context", () => {
    const sanitized = sanitizeContext({});

    expect(sanitized).toEqual({});
  });
});
