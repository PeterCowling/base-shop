// packages/telemetry/src/__tests__/fingerprint.test.ts
import { describe, it, expect } from "@jest/globals";

import { generateFingerprint, trimStack } from "../fingerprint";

describe("generateFingerprint", () => {
  it("generates stable fingerprints for same error", async () => {
    const error = new Error("Test error");
    error.stack = "Error: Test error\n    at foo (file.ts:10:5)";

    const fp1 = await generateFingerprint(error);
    const fp2 = await generateFingerprint(error);

    expect(fp1).toBe(fp2);
  });

  it("generates different fingerprints for different messages", async () => {
    const error1 = new Error("Test error 1");
    error1.stack = "Error: Test error 1\n    at foo (file.ts:10:5)";

    const error2 = new Error("Test error 2");
    error2.stack = "Error: Test error 2\n    at foo (file.ts:10:5)";

    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error2);

    expect(fp1).not.toBe(fp2);
  });

  it("generates different fingerprints for different stack locations", async () => {
    const error1 = new Error("Same error");
    error1.stack = "Error: Same error\n    at foo (file.ts:10:5)";

    const error2 = new Error("Same error");
    error2.stack = "Error: Same error\n    at bar (other.ts:20:3)";

    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error2);

    expect(fp1).not.toBe(fp2);
  });

  it("generates 16 character hex fingerprints", async () => {
    const error = new Error("Test");
    error.stack = "Error: Test\n    at test (test.ts:1:1)";

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(fingerprint)).toBe(true);
  });

  it("handles errors without stack", async () => {
    const error = new Error("No stack");
    error.stack = undefined;

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(fingerprint)).toBe(true);
  });

  it("handles errors with empty stack", async () => {
    const error = new Error("Empty stack");
    error.stack = "";

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
  });

  it("handles errors with only error line (no 'at' frames)", async () => {
    const error = new Error("Malformed stack");
    error.stack = "Error: Malformed stack\nsome random text";

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
  });

  it("extracts first 'at' line for fingerprinting", async () => {
    const error1 = new Error("Test");
    error1.stack =
      "Error: Test\n    at firstFrame (a.ts:1:1)\n    at secondFrame (b.ts:2:2)";

    const error2 = new Error("Test");
    error2.stack =
      "Error: Test\n    at firstFrame (a.ts:1:1)\n    at differentSecond (c.ts:3:3)";

    // Same first frame should produce same fingerprint
    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error2);

    expect(fp1).toBe(fp2);
  });

  it("includes error name in fingerprint", async () => {
    const error1 = new Error("Same message");
    error1.name = "TypeError";
    error1.stack = "TypeError: Same message\n    at foo (file.ts:1:1)";

    const error2 = new Error("Same message");
    error2.name = "RangeError";
    error2.stack = "RangeError: Same message\n    at foo (file.ts:1:1)";

    const fp1 = await generateFingerprint(error1);
    const fp2 = await generateFingerprint(error2);

    expect(fp1).not.toBe(fp2);
  });

  it("handles unicode in error messages", async () => {
    const error = new Error("Error with émojis 🎉 and ünïcödé");
    error.stack = "Error: Error with émojis 🎉 and ünïcödé\n    at test (t.ts:1:1)";

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(fingerprint)).toBe(true);
  });

  it("handles very long error messages", async () => {
    const longMessage = "x".repeat(10000);
    const error = new Error(longMessage);
    error.stack = `Error: ${longMessage}\n    at test (t.ts:1:1)`;

    const fingerprint = await generateFingerprint(error);

    expect(fingerprint).toBeDefined();
    expect(fingerprint).toHaveLength(16);
  });
});

describe("trimStack", () => {
  it("returns stack unchanged if within limit", () => {
    const stack = "Error: Test\n    at foo (a.ts:1)\n    at bar (b.ts:2)";

    const trimmed = trimStack(stack, 5);

    expect(trimmed).toBe(stack);
  });

  it("returns stack unchanged if exactly at limit", () => {
    const stack = "line1\nline2\nline3";

    const trimmed = trimStack(stack, 3);

    expect(trimmed).toBe(stack);
  });

  it("truncates stack exceeding limit", () => {
    const stack = "line1\nline2\nline3\nline4\nline5";

    const trimmed = trimStack(stack, 3);

    expect(trimmed).toBe("line1\nline2\nline3\n...[truncated]");
  });

  it("adds truncation marker", () => {
    const stack = "a\nb\nc\nd\ne\nf";

    const trimmed = trimStack(stack, 2);

    expect(trimmed).toContain("...[truncated]");
    expect(trimmed.split("\n")).toHaveLength(3); // 2 lines + truncation marker
  });

  it("handles single line stack", () => {
    const stack = "Error: Test";

    const trimmed = trimStack(stack, 1);

    expect(trimmed).toBe("Error: Test");
  });

  it("handles empty stack", () => {
    const stack = "";

    const trimmed = trimStack(stack, 5);

    expect(trimmed).toBe("");
  });

  it("handles maxLines of 0", () => {
    const stack = "line1\nline2";

    const trimmed = trimStack(stack, 0);

    expect(trimmed).toBe("\n...[truncated]");
  });

  it("preserves whitespace in lines", () => {
    const stack = "Error: Test\n    at foo (a.ts:1)\n    at bar (b.ts:2)";

    const trimmed = trimStack(stack, 2);

    expect(trimmed).toBe("Error: Test\n    at foo (a.ts:1)\n...[truncated]");
  });
});
