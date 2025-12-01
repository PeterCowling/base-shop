import {
  createPreviewToken,
  createUpgradePreviewToken,
  verifyPreviewToken,
  verifyUpgradePreviewToken,
} from "@platform-core/previewTokens";

describe("previewTokens", () => {
  const payload = { shopId: "shop", pageId: "page1" };
  const secret = "super-secret-value-that-is-long-enough";

  test("create and verify preview token", () => {
    const token = createPreviewToken(payload, secret);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(verifyPreviewToken(token, payload, secret)).toBe(true);
  });

  test("preview token verification fails for mismatched input", () => {
    const token = createPreviewToken(payload, secret);
    expect(
      verifyPreviewToken(token, { shopId: "other", pageId: "page1" }, secret),
    ).toBe(false);
    expect(
      verifyPreviewToken(token, payload, "different-secret-value"),
    ).toBe(false);
    expect(
      verifyPreviewToken("not-a-real-token", payload, secret),
    ).toBe(false);
    expect(verifyPreviewToken(token, payload, undefined)).toBe(false);
  });

  test("create and verify upgrade preview token", () => {
    const token = createUpgradePreviewToken(payload, secret);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(verifyUpgradePreviewToken(token, payload, secret)).toBe(true);
  });

  test("upgrade token verification fails for mismatched input", () => {
    const token = createUpgradePreviewToken(payload, secret);
    expect(
      verifyUpgradePreviewToken(
        token,
        { shopId: "shop", pageId: "other" },
        secret,
      ),
    ).toBe(false);
    expect(
      verifyUpgradePreviewToken(token, payload, "different-secret-value"),
    ).toBe(false);
    expect(
      verifyUpgradePreviewToken("not-a-real-token", payload, secret),
    ).toBe(false);
    expect(verifyUpgradePreviewToken(token, payload, undefined)).toBe(false);
  });
});

