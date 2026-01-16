// packages/telemetry/src/__tests__/captureError.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { captureError, __buffer } from "../index";
import { generateFingerprint } from "../fingerprint";
import { sanitizeContext } from "../sanitize";

describe("captureError", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear buffer
    __buffer.length = 0;

    // Enable telemetry for tests
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_TELEMETRY: "true",
      NODE_ENV: "production",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("normalizes string to Error", async () => {
    await captureError("string error");

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].message).toBe("string error");
    expect(__buffer[0].kind).toBe("error");
  });

  it("normalizes number to Error", async () => {
    await captureError(404);

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].message).toBe("404");
  });

  it("preserves Error instances", async () => {
    const error = new Error("Test error");
    await captureError(error);

    expect(__buffer).toHaveLength(1);
    expect(__buffer[0].message).toBe("Test error");
  });

  it("generates fingerprint", async () => {
    const error = new Error("Test error");
    await captureError(error);

    expect(__buffer[0].fingerprint).toBeDefined();
    expect(__buffer[0].fingerprint).toHaveLength(16);
  });

  it("includes stack trace", async () => {
    const error = new Error("Test error");
    await captureError(error);

    expect(__buffer[0].stack).toBeDefined();
    expect(__buffer[0].stack).toContain("Error: Test error");
  });

  it("includes context fields", async () => {
    const error = new Error("Test error");
    await captureError(error, {
      app: "test-app",
      env: "test",
      requestId: "req-123",
    });

    expect(__buffer[0].app).toBe("test-app");
    expect(__buffer[0].env).toBe("test");
    expect(__buffer[0].requestId).toBe("req-123");
  });

  it("sets default level to error", async () => {
    await captureError(new Error("test"));

    expect(__buffer[0].level).toBe("error");
  });

  it("uses custom level from context", async () => {
    await captureError(new Error("test"), { level: "fatal" });

    expect(__buffer[0].level).toBe("fatal");
  });

  it("respects ENABLED flag", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY = "false";

    await captureError(new Error("test"));

    expect(__buffer).toHaveLength(0);
  });

  it("sets timestamp", async () => {
    const before = Date.now();
    await captureError(new Error("test"));
    const after = Date.now();

    expect(__buffer[0].ts).toBeGreaterThanOrEqual(before);
    expect(__buffer[0].ts).toBeLessThanOrEqual(after);
  });
});

describe("generateFingerprint", () => {
  it("generates stable fingerprints for same error", async () => {
    const error1 = new Error("Test error");
    error1.stack = "Error: Test error\n    at foo (file.ts:10)";

    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error1);

    expect(fp1).toBe(fp2);
  });

  it("generates different fingerprints for different errors", async () => {
    const error1 = new Error("Test error 1");
    error1.stack = "Error: Test error 1\n    at foo (file.ts:10)";

    const error2 = new Error("Test error 2");
    error2.stack = "Error: Test error 2\n    at bar (file.ts:20)";

    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error2);

    expect(fp1).not.toBe(fp2);
  });

  it("generates 16 character fingerprints", async () => {
    const error = new Error("Test");
    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(fingerprint)).toBe(true);
  });

  it("handles errors without stack", async () => {
    const error = new Error("Test");
    error.stack = undefined;

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
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
