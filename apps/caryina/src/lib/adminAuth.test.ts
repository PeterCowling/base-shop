import { compareAdminKey, signAdminSession, verifyAdminSession } from "@/lib/adminAuth";

const TEST_KEY = "caryina-admin-test-key-abc123xyz789-secure";

describe("adminAuth — HMAC sign/verify", () => {
  it("signs a session and verifies it with the same key (TC-02 happy path)", async () => {
    const token = await signAdminSession(TEST_KEY);
    expect(typeof token).toBe("string");
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const valid = await verifyAdminSession(token, TEST_KEY);
    expect(valid).toBe(true);
  });

  it("rejects a token verified with the wrong key (TC-03 wrong key)", async () => {
    const token = await signAdminSession(TEST_KEY);
    const valid = await verifyAdminSession(token, "completely-different-key-xyz-00000000");
    expect(valid).toBe(false);
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await signAdminSession(TEST_KEY);
    const tampered = token.slice(0, -4) + "xxxx";
    const valid = await verifyAdminSession(tampered, TEST_KEY);
    expect(valid).toBe(false);
  });

  it("rejects a token with no signature separator", async () => {
    const valid = await verifyAdminSession("nodothere", TEST_KEY);
    expect(valid).toBe(false);
  });

  it("rejects a malformed token", async () => {
    const valid = await verifyAdminSession("garbage.input", TEST_KEY);
    expect(valid).toBe(false);
  });
});

describe("compareAdminKey", () => {
  it("returns true for identical keys", () => {
    expect(compareAdminKey("my-admin-key-abc", "my-admin-key-abc")).toBe(true);
  });

  it("returns false for different keys", () => {
    expect(compareAdminKey("my-admin-key-abc", "wrong-key-xyz")).toBe(false);
  });

  it("trims whitespace before comparing", () => {
    expect(compareAdminKey("  my-admin-key-abc  ", "my-admin-key-abc")).toBe(true);
  });

  it("returns false when keys differ by case", () => {
    expect(compareAdminKey("MyKey", "mykey")).toBe(false);
  });
});
