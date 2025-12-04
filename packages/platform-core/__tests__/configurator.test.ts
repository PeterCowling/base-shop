import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as configurator from "../src/configurator";

jest.mock("../src/repositories/shops.server", () => ({
  readShop: jest.fn(),
  getShopSettings: jest.fn(),
}));

jest.mock("../src/repositories/pages/index.server", () => ({
  getPages: jest.fn(),
}));

jest.mock("../src/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));

jest.mock("../src/repositories/inventory.server", () => ({
  readInventory: jest.fn(),
}));

const {
  readEnvFile,
  validateEnvFile,
  validateShopEnv,
  checkShopBasics,
  checkTheme,
  checkPayments,
  checkShippingTax,
  checkCheckout,
  checkProductsInventory,
  checkNavigationHome,
  configuratorChecks,
  checkReachSocial,
  getConfiguratorProgressForShop,
  runRequiredConfigChecks,
  getLaunchStatus,
} = configurator;

const shopsRepo = require("../src/repositories/shops.server") as {
  readShop: jest.Mock;
  getShopSettings: jest.Mock;
};

const pagesRepo = require("../src/repositories/pages/index.server") as {
  getPages: jest.Mock;
};

const productsRepo = require("../src/repositories/products.server") as {
  readRepo: jest.Mock;
};

const inventoryRepo = require("../src/repositories/inventory.server") as {
  readInventory: jest.Mock;
};

beforeEach(() => {
  jest.resetAllMocks();
  pagesRepo.getPages.mockResolvedValue([]);
  productsRepo.readRepo.mockResolvedValue([]);
  inventoryRepo.readInventory.mockResolvedValue([]);
});

describe("readEnvFile", () => {
  it("ignores comments and empty values", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(
      envPath,
      [
        "FOO=bar",
        "# this is a comment",
        "EMPTY=",
        "BAR=baz",
        "",
      ].join("\n"),
    );

    expect(readEnvFile(envPath)).toEqual({ FOO: "bar", BAR: "baz" });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("validateEnvFile", () => {
  it("throws for missing files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const missing = path.join(tmpDir, "missing.env");
    expect(() => validateEnvFile(missing)).toThrow(`Missing ${missing}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws for invalid entries", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar");

    jest
      .spyOn(configurator, "readEnvFile")
      .mockReturnValue({ FOO: 1 } as any);

    expect(() => validateEnvFile(envPath)).toThrow();

    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back to local reader when export is missing", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar\n");

    const original = (configurator as any).readEnvFile;
    // Remove exported reader to exercise fallback branch
    delete (configurator as any).readEnvFile;

    try {
      expect(() => validateEnvFile(envPath)).not.toThrow();
    } finally {
      (configurator as any).readEnvFile = original;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("validateShopEnv", () => {
  const shop = "my-shop";

  it("throws when required plugin variables are missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      "STRIPE_SECRET_KEY=sk_test\n",
    );

    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ paymentProviders: ["stripe"] }),
    );

    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).toThrow(
        "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      );
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("passes when all required plugin variables are present", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      [
        "STRIPE_SECRET_KEY=sk_test",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test",
        "STRIPE_WEBHOOK_SECRET=whsec",
      ].join("\n"),
    );

    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ paymentProviders: ["stripe"] }),
    );

    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).not.toThrow();
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("skips plugin validation when shop config is missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, ".env"), "");
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).not.toThrow();
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires sanity plugin variables when enabled", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      ["SANITY_PROJECT_ID=pid", "SANITY_DATASET=dataset"].join("\n"),
    );
    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ sanityBlog: {} }),
    );
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).toThrow("Missing SANITY_TOKEN");
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("Config checks", () => {
  const shopId = "test-shop";

  function mockShop(overrides: Partial<unknown> = {}) {
    shopsRepo.readShop.mockResolvedValue({
      id: shopId,
      name: "Test shop",
      themeId: "base",
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: { primary: "primary" },
      filterMappings: {},
      priceOverrides: {},
      localeOverrides: {},
      navigation: [],
      analyticsEnabled: false,
      coverageIncluded: true,
      componentVersions: {},
      rentalSubscriptions: [],
      subscriptionsEnabled: false,
      luxuryFeatures: {
        blog: false,
        contentMerchandising: false,
        raTicketing: false,
        fraudReviewThreshold: 0,
        requireStrongCustomerAuth: false,
        strictReturnConditions: false,
        trackingDashboard: false,
        premierDelivery: false,
      },
      ...(overrides as Record<string, unknown>),
    });
  }

  function mockSettings(overrides: Partial<unknown> = {}) {
    shopsRepo.getShopSettings.mockResolvedValue({
      languages: ["en"],
      seo: {},
      updatedAt: "",
      updatedBy: "",
      ...(overrides as Record<string, unknown>),
    });
  }

  it("checkShopBasics returns ok when shop and languages exist", async () => {
    mockShop();
    mockSettings({ languages: ["en", "de"] });

    const result = await checkShopBasics(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkShopBasics reports missing languages", async () => {
    mockShop();
    mockSettings({ languages: [] });

    const result = await checkShopBasics(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-languages");
    }
  });

  it("checkTheme returns ok when themeId and tokens are present", async () => {
    mockShop({
      themeId: "base",
      themeTokens: { primary: "primary" },
    });
    mockSettings();

    const result = await checkTheme(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkTheme reports missing theme tokens", async () => {
    mockShop({
      themeId: "base",
      themeTokens: {},
    });
    mockSettings();

    const result = await checkTheme(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-theme-tokens");
    }
  });

  it("checkPayments validates currency and env vars", async () => {
    mockShop({
      paymentProviders: ["stripe"],
      billingProvider: "stripe",
    });
    mockSettings({ currency: "EUR" });

    const originalEnv = { ...process.env };
    try {
      process.env.STRIPE_SECRET_KEY = "sk_test";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec";

      const result = await checkPayments(shopId);
      expect(result).toEqual({ ok: true });
    } finally {
      process.env = originalEnv;
    }
  });

  it("checkPayments reports missing currency", async () => {
    mockShop({
      paymentProviders: ["stripe"],
      billingProvider: "stripe",
    });
    mockSettings({});

    const result = await checkPayments(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-currency");
    }
  });

  it("checkShippingTax returns ok when taxRegion and shippingProviders exist", async () => {
    mockShop({ shippingProviders: ["dhl"] });
    mockSettings({ taxRegion: "EU" });

    const result = await checkShippingTax(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkShippingTax reports missing shipping provider", async () => {
    mockShop({ shippingProviders: [] });
    mockSettings({ taxRegion: "EU" });

    const result = await checkShippingTax(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-shipping-provider");
    }
  });

  it("checkCheckout returns ok when a published checkout page exists", async () => {
    pagesRepo.getPages.mockResolvedValue([
      {
        id: "p1",
        slug: "checkout",
        status: "published",
        visibility: "public",
        components: [],
        seo: {
          title: { en: "Checkout" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
      },
    ]);

    const result = await checkCheckout(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkCheckout reports missing checkout page", async () => {
    pagesRepo.getPages.mockResolvedValue([]);

    const result = await checkCheckout(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-checkout-page");
    }
  });

  it("checkProductsInventory returns ok when products and inventory are present", async () => {
    productsRepo.readRepo.mockResolvedValue([
      {
        id: "prod1",
        shop: shopId,
        status: "active",
        row_version: 1,
      },
    ]);
    inventoryRepo.readInventory.mockResolvedValue([
      {
        sku: "sku1",
        productId: "prod1",
        quantity: 5,
        variantAttributes: {},
      },
    ]);

    const result = await checkProductsInventory(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkProductsInventory reports when no active products", async () => {
    productsRepo.readRepo.mockResolvedValue([]);
    inventoryRepo.readInventory.mockResolvedValue([]);

    const result = await checkProductsInventory(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-active-products");
    }
  });

  it("checkNavigationHome returns ok when navigation contains a link", async () => {
    mockShop({
      navigation: [{ label: "Home", url: "/" }],
    });
    mockSettings();
    pagesRepo.getPages.mockResolvedValue([
      {
        id: "home",
        slug: "",
        status: "published",
        components: [{ id: "h", type: "HeroBanner" }],
        seo: { title: { en: "Home" }, description: {}, image: {} },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.home.default",
      },
      {
        id: "pdp",
        slug: "products",
        status: "draft",
        components: [{ id: "p1", type: "PDPDetailsSection" }],
        seo: { title: { en: "PDP" }, description: {}, image: {} },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.product.default",
      },
    ]);

    const result = await checkNavigationHome(shopId);
    expect(result).toEqual({ ok: true });
  });

  it("checkNavigationHome reports missing navigation", async () => {
    mockShop({ navigation: [] });
    mockSettings();

    const result = await checkNavigationHome(shopId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-navigation");
    }
  });

  it("configuratorChecks exposes step mappings for core steps", () => {
    expect(configuratorChecks["shop-basics"]).toBe(checkShopBasics);
    expect(configuratorChecks.theme).toBe(checkTheme);
    expect(configuratorChecks.payments).toBe(checkPayments);
    expect(configuratorChecks["shipping-tax"]).toBe(checkShippingTax);
    expect(configuratorChecks.checkout).toBe(checkCheckout);
    expect(configuratorChecks["products-inventory"]).toBe(
      checkProductsInventory,
    );
    expect(configuratorChecks["navigation-home"]).toBe(checkNavigationHome);
  });

  it("getConfiguratorProgressForShop reports complete when all checks pass", async () => {
    mockShop({
      navigation: [{ label: "Home", url: "/" }],
      themeId: "base",
      themeTokens: { primary: "primary" },
      paymentProviders: ["stripe"],
      billingProvider: "stripe",
      shippingProviders: ["dhl"],
    });
    mockSettings({
      languages: ["en"],
      currency: "EUR",
      taxRegion: "EU",
      seo: { image: "https://example.com/share.jpg" },
    });
    pagesRepo.getPages.mockResolvedValue([
      {
        id: "p1",
        slug: "",
        status: "published",
        visibility: "public",
        components: [
          { id: "h", type: "HeroBanner" },
          { id: "social-links", type: "SocialLinks", facebook: "fb" },
          { id: "social-proof", type: "SocialProof" },
        ],
        seo: {
          title: { en: "Home" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.home.default",
      },
      {
        id: "p2",
        slug: "products",
        status: "published",
        visibility: "public",
        components: [{ id: "pdp-details", type: "PDPDetailsSection" }],
        seo: {
          title: { en: "Product" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.product.default",
      },
      {
        id: "p3",
        slug: "checkout",
        status: "published",
        visibility: "public",
        components: [],
        seo: {
          title: { en: "Checkout" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
      },
    ]);
    productsRepo.readRepo.mockResolvedValue([
      {
        id: "prod1",
        shop: shopId,
        status: "active",
        row_version: 1,
      },
    ]);
    inventoryRepo.readInventory.mockResolvedValue([
      {
        sku: "sku1",
        productId: "prod1",
        quantity: 5,
        variantAttributes: {},
      },
    ]);

    const originalEnv = { ...process.env };
    try {
      process.env.STRIPE_SECRET_KEY = "sk_test";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec";

      const progress = await getConfiguratorProgressForShop(shopId);
      expect(progress.shopId).toBe(shopId);
      // All known steps should be complete or pending (for steps without checks).
      expect(progress.steps["shop-basics"]).toBe("complete");
      expect(progress.steps.theme).toBe("complete");
      expect(progress.steps.payments).toBe("complete");
      expect(progress.steps["shipping-tax"]).toBe("complete");
      expect(progress.steps.checkout).toBe("complete");
      expect(progress.steps["products-inventory"]).toBe("complete");
      expect(progress.steps["navigation-home"]).toBe("complete");
    } finally {
      process.env = originalEnv;
    }
  });

  it("runRequiredConfigChecks reports failures when checks fail", async () => {
    mockShop({
      navigation: [],
      themeId: "",
      themeTokens: {},
      paymentProviders: [],
      shippingProviders: [],
    });
    mockSettings({ languages: [], currency: undefined, taxRegion: undefined });
    pagesRepo.getPages.mockResolvedValue([]);
    productsRepo.readRepo.mockResolvedValue([]);
    inventoryRepo.readInventory.mockResolvedValue([]);

    const result = await runRequiredConfigChecks(shopId);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Configuration checks failed for steps:");
  });

  it("getLaunchStatus returns blocked when required checks fail", async () => {
    mockShop({
      navigation: [],
    });
    mockSettings({ languages: [] });
    pagesRepo.getPages.mockResolvedValue([]);
    productsRepo.readRepo.mockResolvedValue([]);
    inventoryRepo.readInventory.mockResolvedValue([]);

    const status = await getLaunchStatus("prod", shopId);
    expect(status.env).toBe("prod");
    expect(status.status).toBe("blocked");
    expect(Array.isArray(status.reasons)).toBe(true);
    expect(status.reasons.length).toBeGreaterThan(0);
  });

  it("getLaunchStatus returns ok when required checks pass", async () => {
    mockShop({
      navigation: [{ label: "Home", url: "/" }],
      themeId: "base",
      themeTokens: { primary: "primary" },
      paymentProviders: ["stripe"],
      billingProvider: "stripe",
      shippingProviders: ["dhl"],
      domain: { name: "example.com" },
    });
    mockSettings({
      languages: ["en"],
      currency: "EUR",
      taxRegion: "EU",
      seo: { image: "https://example.com/share.jpg" },
    });
    pagesRepo.getPages.mockResolvedValue([
      {
        id: "p1",
        slug: "",
        status: "published",
        visibility: "public",
        components: [
          { id: "h", type: "HeroBanner" },
          { id: "social-links", type: "SocialLinks", facebook: "fb" },
          { id: "social-proof", type: "SocialProof" },
        ],
        seo: {
          title: { en: "Home" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.home.default",
      },
      {
        id: "p2",
        slug: "products",
        status: "published",
        visibility: "public",
        components: [{ id: "pdp", type: "PDPDetailsSection" }],
        seo: {
          title: { en: "Product" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
        stableId: "core.page.product.default",
      },
      {
        id: "p3",
        slug: "checkout",
        status: "published",
        visibility: "public",
        components: [],
        seo: {
          title: { en: "Checkout" },
          description: {},
          image: {},
        },
        createdAt: "",
        updatedAt: "",
        createdBy: "",
      },
    ]);
    productsRepo.readRepo.mockResolvedValue([
      {
        id: "prod1",
        shop: shopId,
        status: "active",
        row_version: 1,
      },
    ]);
    inventoryRepo.readInventory.mockResolvedValue([
      {
        sku: "sku1",
        productId: "prod1",
        quantity: 5,
        variantAttributes: {},
      },
    ]);

    const originalEnv = { ...process.env };
    try {
      process.env.STRIPE_SECRET_KEY = "sk_test";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec";

      const reach = await checkReachSocial(shopId);
      expect(reach).toEqual({ ok: true });
      const status = await getLaunchStatus("stage", shopId);
      expect(status.env).toBe("stage");
      expect(status.status).toBe("ok");
      expect(status.reasons).toEqual([]);
    } finally {
      process.env = originalEnv;
    }
  });
});
