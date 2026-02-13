/**
 * Tests for apps/cochlearfit/src/lib/site.ts (SEO-02)
 *
 * TC-01: SITE_URL uses env var when set
 * TC-02: SITE_URL falls back to placeholder when env var is not set
 */

describe("SITE_URL env-driven pattern", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("TC-01: returns env value when NEXT_PUBLIC_BASE_URL is set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://cochlearfit.com";
    const { SITE_URL } = await import("../src/lib/site");
    expect(SITE_URL).toBe("https://cochlearfit.com");
  });

  it("TC-02: falls back to placeholder when env var is not set", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const { SITE_URL } = await import("../src/lib/site");
    expect(SITE_URL).toBe("https://cochlearfit.example");
  });
});
