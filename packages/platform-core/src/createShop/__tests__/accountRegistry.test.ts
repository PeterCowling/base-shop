/**
 * Tests for LAUNCH-28: Centralized Account Registry
 */

import {
  accountAllocationSchema,
  accountPoolSchema,
  accountStatusSchema,
  canAllocate,
  getRequiredEnvVarsForConfig,
  type RegisteredAccount,
  registeredAccountSchema,
  type ShopAccountConfig,
  shopAccountConfigSchema,
  validateShopAccountConfig,
} from "../accountRegistry";

// ============================================================
// Account Status Schema Tests
// ============================================================

describe("accountStatusSchema", () => {
  it("accepts valid status values", () => {
    expect(accountStatusSchema.parse("active")).toBe("active");
    expect(accountStatusSchema.parse("pending")).toBe("pending");
    expect(accountStatusSchema.parse("suspended")).toBe("suspended");
    expect(accountStatusSchema.parse("deprecated")).toBe("deprecated");
  });

  it("rejects invalid status values", () => {
    expect(() => accountStatusSchema.parse("invalid")).toThrow();
    expect(() => accountStatusSchema.parse("")).toThrow();
    expect(() => accountStatusSchema.parse(123)).toThrow();
  });
});

// ============================================================
// Registered Account Schema Tests
// ============================================================

describe("registeredAccountSchema", () => {
  const validAccount = {
    id: "acme-stripe-prod-01",
    provider: "stripe",
    templateId: "core.payment.stripe.standard",
    label: "ACME Production Stripe",
    status: "active",
    environment: "prod",
    region: "US",
    maxAllocations: 10,
    currentAllocations: 3,
    directorApproved: true,
    approvedAt: "2026-01-15T10:00:00Z",
    approvedBy: "director@acme.com",
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  };

  it("accepts valid account with all fields", () => {
    const result = registeredAccountSchema.parse(validAccount);
    expect(result.id).toBe("acme-stripe-prod-01");
    expect(result.provider).toBe("stripe");
    expect(result.directorApproved).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      id: "test-account",
      provider: "stripe",
      templateId: "core.payment.stripe.standard",
      label: "Test Account",
      environment: "dev",
      createdAt: "2026-01-10T10:00:00Z",
      updatedAt: "2026-01-10T10:00:00Z",
    };
    const result = registeredAccountSchema.parse(minimal);
    expect(result.status).toBe("pending");
    expect(result.region).toBe("global");
    expect(result.maxAllocations).toBe(0);
    expect(result.currentAllocations).toBe(0);
    expect(result.directorApproved).toBe(false);
  });

  it("rejects account with missing required fields", () => {
    expect(() => registeredAccountSchema.parse({})).toThrow();
    expect(() =>
      registeredAccountSchema.parse({ id: "test" })
    ).toThrow();
  });

  it("rejects account with invalid environment", () => {
    expect(() =>
      registeredAccountSchema.parse({
        ...validAccount,
        environment: "invalid",
      })
    ).toThrow();
  });

  it("accepts valid environment values", () => {
    for (const env of ["dev", "staging", "prod"]) {
      const result = registeredAccountSchema.parse({
        ...validAccount,
        environment: env,
      });
      expect(result.environment).toBe(env);
    }
  });
});

// ============================================================
// Account Allocation Schema Tests
// ============================================================

describe("accountAllocationSchema", () => {
  const validAllocation = {
    id: "alloc-001",
    shopId: "shop-acme",
    accountId: "acme-stripe-prod-01",
    category: "payment",
    isPrimary: true,
    status: "active",
    allocatedAt: "2026-01-15T10:00:00Z",
    allocatedBy: "admin@acme.com",
  };

  it("accepts valid allocation", () => {
    const result = accountAllocationSchema.parse(validAllocation);
    expect(result.id).toBe("alloc-001");
    expect(result.category).toBe("payment");
    expect(result.isPrimary).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      id: "alloc-002",
      shopId: "shop-test",
      accountId: "test-account",
      category: "shipping",
      allocatedAt: "2026-01-15T10:00:00Z",
    };
    const result = accountAllocationSchema.parse(minimal);
    expect(result.isPrimary).toBe(true);
    expect(result.status).toBe("pending");
  });

  it("accepts all valid category values", () => {
    for (const category of ["payment", "shipping", "tax"]) {
      const result = accountAllocationSchema.parse({
        ...validAllocation,
        category,
      });
      expect(result.category).toBe(category);
    }
  });

  it("rejects invalid category", () => {
    expect(() =>
      accountAllocationSchema.parse({
        ...validAllocation,
        category: "invalid",
      })
    ).toThrow();
  });

  it("accepts revoked allocation with reason", () => {
    const result = accountAllocationSchema.parse({
      ...validAllocation,
      status: "revoked",
      revokedAt: "2026-01-20T10:00:00Z",
      revocationReason: "Shop closed",
    });
    expect(result.status).toBe("revoked");
    expect(result.revocationReason).toBe("Shop closed");
  });
});

// ============================================================
// Account Pool Schema Tests
// ============================================================

describe("accountPoolSchema", () => {
  it("accepts valid pool", () => {
    const pool = {
      id: "stripe-pool-us",
      name: "US Stripe Accounts",
      description: "Pool of Stripe accounts for US shops",
      category: "payment",
      accountIds: ["acme-stripe-01", "acme-stripe-02"],
      defaultAccountId: "acme-stripe-01",
      acceptingAllocations: true,
    };
    const result = accountPoolSchema.parse(pool);
    expect(result.id).toBe("stripe-pool-us");
    expect(result.accountIds).toHaveLength(2);
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      id: "shipping-pool",
      name: "Shipping Pool",
      category: "shipping",
      accountIds: [],
    };
    const result = accountPoolSchema.parse(minimal);
    expect(result.acceptingAllocations).toBe(true);
  });
});

// ============================================================
// Shop Account Config Schema Tests
// ============================================================

describe("shopAccountConfigSchema", () => {
  it("accepts centralized payment config", () => {
    const config: ShopAccountConfig = {
      payment: {
        type: "centralized",
        accountId: "acme-stripe-01",
      },
    };
    const result = shopAccountConfigSchema.parse(config);
    expect(result.payment?.type).toBe("centralized");
  });

  it("accepts custom payment config", () => {
    const config: ShopAccountConfig = {
      payment: {
        type: "custom",
        templateId: "core.payment.stripe.standard",
      },
    };
    const result = shopAccountConfigSchema.parse(config);
    expect(result.payment?.type).toBe("custom");
  });

  it("accepts flat-rate shipping config", () => {
    const config: ShopAccountConfig = {
      shipping: {
        type: "flat-rate",
        domestic: 599,
        international: 1999,
        freeThreshold: 5000,
      },
    };
    const result = shopAccountConfigSchema.parse(config);
    if (result.shipping?.type === "flat-rate") {
      expect(result.shipping.domestic).toBe(599);
      expect(result.shipping.international).toBe(1999);
      expect(result.shipping.freeThreshold).toBe(5000);
    }
  });

  it("accepts manual tax config", () => {
    const config: ShopAccountConfig = {
      tax: {
        type: "manual",
        defaultRate: 20,
        regions: {
          DE: 19,
          FR: 20,
          IT: 22,
        },
      },
    };
    const result = shopAccountConfigSchema.parse(config);
    if (result.tax?.type === "manual") {
      expect(result.tax.defaultRate).toBe(20);
      expect(result.tax.regions?.DE).toBe(19);
    }
  });

  it("accepts empty config", () => {
    const result = shopAccountConfigSchema.parse({});
    expect(result.payment).toBeUndefined();
    expect(result.shipping).toBeUndefined();
    expect(result.tax).toBeUndefined();
  });

  it("accepts full multi-provider config", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "stripe-01" },
      shipping: { type: "centralized", accountId: "dhl-01" },
      tax: { type: "centralized", accountId: "taxjar-01" },
    };
    const result = shopAccountConfigSchema.parse(config);
    expect(result.payment?.type).toBe("centralized");
    expect(result.shipping?.type).toBe("centralized");
    expect(result.tax?.type).toBe("centralized");
  });
});

// ============================================================
// canAllocate Helper Tests
// ============================================================

describe("canAllocate", () => {
  const baseAccount: RegisteredAccount = {
    id: "test-account",
    provider: "stripe",
    templateId: "core.payment.stripe.standard",
    label: "Test Account",
    status: "active",
    environment: "prod",
    region: "global",
    maxAllocations: 10,
    currentAllocations: 5,
    directorApproved: true,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z",
    metadata: {},
  };

  it("returns true for active, approved account with capacity", () => {
    expect(canAllocate(baseAccount)).toBe(true);
  });

  it("returns false for non-active status", () => {
    expect(canAllocate({ ...baseAccount, status: "pending" })).toBe(false);
    expect(canAllocate({ ...baseAccount, status: "suspended" })).toBe(false);
    expect(canAllocate({ ...baseAccount, status: "deprecated" })).toBe(false);
  });

  it("returns false for non-approved account", () => {
    expect(canAllocate({ ...baseAccount, directorApproved: false })).toBe(false);
  });

  it("returns false when at max allocations", () => {
    expect(
      canAllocate({ ...baseAccount, currentAllocations: 10 })
    ).toBe(false);
  });

  it("returns false when over max allocations", () => {
    expect(
      canAllocate({ ...baseAccount, currentAllocations: 15 })
    ).toBe(false);
  });

  it("returns true for unlimited allocations (maxAllocations = 0)", () => {
    expect(
      canAllocate({ ...baseAccount, maxAllocations: 0, currentAllocations: 100 })
    ).toBe(true);
  });
});

// ============================================================
// validateShopAccountConfig Helper Tests
// ============================================================

describe("validateShopAccountConfig", () => {
  const activeAccount: RegisteredAccount = {
    id: "stripe-01",
    provider: "stripe",
    templateId: "core.payment.stripe.standard",
    label: "Stripe Account 01",
    status: "active",
    environment: "prod",
    region: "global",
    maxAllocations: 10,
    currentAllocations: 5,
    directorApproved: true,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z",
    metadata: {},
  };

  const pendingAccount: RegisteredAccount = {
    ...activeAccount,
    id: "stripe-02",
    status: "pending",
  };

  const availableAccounts = [activeAccount, pendingAccount];

  it("returns valid for config with allocatable centralized account", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "stripe-01" },
    };
    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(true);
  });

  it("returns invalid for non-existent account", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "nonexistent" },
    };
    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain("payment: Account not found: nonexistent");
    }
  });

  it("returns invalid for non-allocatable account (pending status)", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "stripe-02" },
    };
    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]).toContain("cannot accept allocations");
    }
  });

  it("returns valid for custom config (no account reference)", () => {
    const config: ShopAccountConfig = {
      payment: { type: "custom", templateId: "core.payment.stripe.standard" },
    };
    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(true);
  });

  it("returns valid for flat-rate shipping (no account reference)", () => {
    const config: ShopAccountConfig = {
      shipping: { type: "flat-rate", domestic: 599 },
    };
    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(true);
  });

  it("returns valid for empty config", () => {
    const result = validateShopAccountConfig({}, availableAccounts);
    expect(result.valid).toBe(true);
  });

  it("validates all centralized account references", () => {
    const shippingAccount: RegisteredAccount = {
      ...activeAccount,
      id: "dhl-01",
      provider: "dhl",
    };
    const accounts = [...availableAccounts, shippingAccount];

    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "stripe-01" },
      shipping: { type: "centralized", accountId: "dhl-01" },
    };

    const result = validateShopAccountConfig(config, accounts);
    expect(result.valid).toBe(true);
  });

  it("returns all errors for multiple invalid references", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "nonexistent-payment" },
      shipping: { type: "centralized", accountId: "nonexistent-shipping" },
      tax: { type: "centralized", accountId: "nonexistent-tax" },
    };

    const result = validateShopAccountConfig(config, availableAccounts);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(3);
    }
  });
});

// ============================================================
// getRequiredEnvVarsForConfig Helper Tests
// ============================================================

describe("getRequiredEnvVarsForConfig", () => {
  const templates = [
    {
      id: "core.payment.stripe.standard",
      requiredEnvVars: [
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ],
    },
    {
      id: "core.shipping.dhl.standard",
      requiredEnvVars: ["DHL_API_KEY", "DHL_API_SECRET", "DHL_ACCOUNT_NUMBER"],
    },
    {
      id: "core.tax.taxjar.standard",
      requiredEnvVars: ["TAXJAR_API_KEY"],
    },
  ];

  it("returns empty array for centralized config (no custom env vars needed)", () => {
    const config: ShopAccountConfig = {
      payment: { type: "centralized", accountId: "stripe-01" },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toEqual([]);
  });

  it("returns template env vars for custom payment config", () => {
    const config: ShopAccountConfig = {
      payment: { type: "custom", templateId: "core.payment.stripe.standard" },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toContain("STRIPE_SECRET_KEY");
    expect(result).toContain("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    expect(result).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("returns template env vars for custom shipping config", () => {
    const config: ShopAccountConfig = {
      shipping: { type: "custom", templateId: "core.shipping.dhl.standard" },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toContain("DHL_API_KEY");
    expect(result).toContain("DHL_API_SECRET");
    expect(result).toContain("DHL_ACCOUNT_NUMBER");
  });

  it("returns empty array for flat-rate shipping (no external credentials)", () => {
    const config: ShopAccountConfig = {
      shipping: { type: "flat-rate", domestic: 599 },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toEqual([]);
  });

  it("returns empty array for manual tax (no external credentials)", () => {
    const config: ShopAccountConfig = {
      tax: { type: "manual", defaultRate: 20 },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toEqual([]);
  });

  it("combines and dedupes env vars from multiple custom configs", () => {
    const config: ShopAccountConfig = {
      payment: { type: "custom", templateId: "core.payment.stripe.standard" },
      shipping: { type: "custom", templateId: "core.shipping.dhl.standard" },
      tax: { type: "custom", templateId: "core.tax.taxjar.standard" },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toContain("STRIPE_SECRET_KEY");
    expect(result).toContain("DHL_API_KEY");
    expect(result).toContain("TAXJAR_API_KEY");
    expect(result).toHaveLength(7); // 3 + 3 + 1
  });

  it("returns empty array for unknown template ID", () => {
    const config: ShopAccountConfig = {
      payment: { type: "custom", templateId: "unknown.template" },
    };
    const result = getRequiredEnvVarsForConfig(config, templates);
    expect(result).toEqual([]);
  });
});
