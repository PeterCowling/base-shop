const ENV_KEYS = [
  "STEALTH_MODE",
  "XA_STEALTH_MODE",
  "NEXT_PUBLIC_STEALTH_MODE",
  "NEXT_PUBLIC_STEALTH_BRAND_NAME",
  "NEXT_PUBLIC_SITE_DOMAIN",
  "XA_ALLOW_INDEXING",
];

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  jest.resetModules();
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

it("keeps site config non-identifying in stealth mode (even if public env vars are set)", async () => {
  process.env.NEXT_PUBLIC_STEALTH_MODE = "true";
  process.env.NEXT_PUBLIC_STEALTH_BRAND_NAME = "Private preview";
  process.env.NEXT_PUBLIC_SITE_DOMAIN = "competitor-proof.example";

  const { siteConfig } = await import("../lib/siteConfig");

  expect(siteConfig.stealthMode).toBe(true);
  expect(siteConfig.brandName).toBe("Private preview");
  expect(siteConfig.domain).toBe("");
  expect(siteConfig.legalEntityName).toBe("");
  expect(siteConfig.legalAddress).toBe("");
  expect(siteConfig.supportEmail).toBe("");
  expect(siteConfig.showContactInfo).toBe(false);
  expect(siteConfig.showLegalInfo).toBe(false);
  expect(siteConfig.showSocialLinks).toBe(false);
});

it("disallows indexing via robots() in stealth mode", async () => {
  process.env.XA_STEALTH_MODE = "true";
  process.env.XA_ALLOW_INDEXING = "true";

  const { default: robots } = await import("../app/robots");
  expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
});

