/**
 * Tests for LAUNCH-28 + LAUNCH-14: Provider Templates
 *
 * Tests payment, shipping, and tax provider templates including:
 * - Template schema validation
 * - Template registry queries
 * - Director-approved filtering
 * - Provider-specific queries
 */

import {
  allProviderTemplates,
  getDirectorApprovedTemplates,
  getProviderTemplate,
  getProviderTemplatesByCategory,
  getProviderTemplatesByProvider,
  paymentProviderTemplates,
  type ProviderTemplate,
  providerTemplateSchema,
  shippingProviderTemplates,
  taxProviderTemplates,
  validateProviderTemplate,
} from "../providerTemplates";

// ============================================================
// Provider Template Schema Tests
// ============================================================

describe("providerTemplateSchema", () => {
  const validTemplate: ProviderTemplate = {
    id: "test.payment.example",
    version: "1.0.0",
    provider: "example",
    label: "Example Payment",
    description: "An example payment provider for testing",
    category: "payment",
    capabilities: ["card-payments", "refunds"],
    requiredEnvVars: ["EXAMPLE_API_KEY"],
    optionalEnvVars: ["EXAMPLE_DEBUG"],
    webhookPath: "/api/example-webhook",
    docsUrl: "https://example.com/docs",
    supportedCurrencies: ["USD", "EUR"],
    supportedCountries: ["US", "DE"],
    directorApproved: true,
    origin: "core",
  };

  it("accepts valid template with all fields", () => {
    const result = providerTemplateSchema.parse(validTemplate);
    expect(result.id).toBe("test.payment.example");
    expect(result.capabilities).toContain("card-payments");
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      id: "test.shipping.minimal",
      version: "1.0.0",
      provider: "minimal",
      label: "Minimal Provider",
      description: "A minimal provider",
      category: "shipping",
      capabilities: [],
      requiredEnvVars: [],
    };
    const result = providerTemplateSchema.parse(minimal);
    expect(result.directorApproved).toBe(false);
    expect(result.origin).toBe("core");
  });

  it("accepts all valid category values", () => {
    for (const category of ["payment", "shipping", "tax"] as const) {
      const result = providerTemplateSchema.parse({
        ...validTemplate,
        category,
      });
      expect(result.category).toBe(category);
    }
  });

  it("rejects invalid category", () => {
    expect(() =>
      providerTemplateSchema.parse({
        ...validTemplate,
        category: "invalid",
      })
    ).toThrow();
  });

  it("rejects template with missing required fields", () => {
    expect(() => providerTemplateSchema.parse({})).toThrow();
    expect(() =>
      providerTemplateSchema.parse({ id: "test" })
    ).toThrow();
  });
});

// ============================================================
// Payment Provider Templates Tests (LAUNCH-28)
// ============================================================

describe("paymentProviderTemplates", () => {
  it("contains expected payment providers", () => {
    const providers = paymentProviderTemplates.map((t) => t.provider);
    expect(providers).toContain("stripe");
    expect(providers).toContain("paypal");
  });

  it("all templates have payment category", () => {
    for (const template of paymentProviderTemplates) {
      expect(template.category).toBe("payment");
    }
  });

  it("Stripe Standard template has expected capabilities", () => {
    const stripeStandard = paymentProviderTemplates.find(
      (t) => t.id === "core.payment.stripe.standard"
    );
    expect(stripeStandard).toBeDefined();
    expect(stripeStandard?.capabilities).toContain("card-payments");
    expect(stripeStandard?.capabilities).toContain("checkout-sessions");
    expect(stripeStandard?.capabilities).toContain("webhooks");
    expect(stripeStandard?.capabilities).toContain("refunds");
  });

  it("Stripe Standard template has required env vars", () => {
    const stripeStandard = paymentProviderTemplates.find(
      (t) => t.id === "core.payment.stripe.standard"
    );
    expect(stripeStandard?.requiredEnvVars).toContain("STRIPE_SECRET_KEY");
    expect(stripeStandard?.requiredEnvVars).toContain(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    );
    expect(stripeStandard?.requiredEnvVars).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("Stripe Connect template has platform capabilities", () => {
    const stripeConnect = paymentProviderTemplates.find(
      (t) => t.id === "core.payment.stripe.connect"
    );
    expect(stripeConnect).toBeDefined();
    expect(stripeConnect?.capabilities).toContain("connected-accounts");
    expect(stripeConnect?.capabilities).toContain("split-payments");
    expect(stripeConnect?.capabilities).toContain("platform-fees");
  });

  it("PayPal Standard template exists with expected structure", () => {
    const paypal = paymentProviderTemplates.find(
      (t) => t.id === "core.payment.paypal.standard"
    );
    expect(paypal).toBeDefined();
    expect(paypal?.provider).toBe("paypal");
    expect(paypal?.capabilities).toContain("paypal-checkout");
    expect(paypal?.requiredEnvVars).toContain("PAYPAL_CLIENT_ID");
  });

  it("at least one payment template is director-approved", () => {
    const approved = paymentProviderTemplates.filter((t) => t.directorApproved);
    expect(approved.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Shipping Provider Templates Tests (LAUNCH-14)
// ============================================================

describe("shippingProviderTemplates", () => {
  it("contains expected shipping providers", () => {
    const providers = shippingProviderTemplates.map((t) => t.provider);
    expect(providers).toContain("dhl");
    expect(providers).toContain("ups");
    expect(providers).toContain("flat-rate");
  });

  it("all templates have shipping category", () => {
    for (const template of shippingProviderTemplates) {
      expect(template.category).toBe("shipping");
    }
  });

  it("DHL Express template has expected capabilities", () => {
    const dhl = shippingProviderTemplates.find(
      (t) => t.id === "core.shipping.dhl.standard"
    );
    expect(dhl).toBeDefined();
    expect(dhl?.capabilities).toContain("real-time-rates");
    expect(dhl?.capabilities).toContain("label-generation");
    expect(dhl?.capabilities).toContain("tracking");
    expect(dhl?.capabilities).toContain("international-shipping");
  });

  it("DHL Express template has required env vars", () => {
    const dhl = shippingProviderTemplates.find(
      (t) => t.id === "core.shipping.dhl.standard"
    );
    expect(dhl?.requiredEnvVars).toContain("DHL_API_KEY");
    expect(dhl?.requiredEnvVars).toContain("DHL_API_SECRET");
    expect(dhl?.requiredEnvVars).toContain("DHL_ACCOUNT_NUMBER");
  });

  it("UPS template has expected capabilities", () => {
    const ups = shippingProviderTemplates.find(
      (t) => t.id === "core.shipping.ups.standard"
    );
    expect(ups).toBeDefined();
    expect(ups?.capabilities).toContain("real-time-rates");
    expect(ups?.capabilities).toContain("label-generation");
    expect(ups?.capabilities).toContain("tracking");
    expect(ups?.capabilities).toContain("pickup-scheduling");
  });

  it("Flat Rate shipping has no external env vars", () => {
    const flatRate = shippingProviderTemplates.find(
      (t) => t.id === "core.shipping.flat-rate.standard"
    );
    expect(flatRate).toBeDefined();
    expect(flatRate?.requiredEnvVars).toEqual([]);
    expect(flatRate?.capabilities).toContain("flat-rate");
    expect(flatRate?.capabilities).toContain("free-shipping-threshold");
  });

  it("Premier Shipping template exists for luxury items", () => {
    const premier = shippingProviderTemplates.find(
      (t) => t.id === "core.shipping.premier.standard"
    );
    expect(premier).toBeDefined();
    expect(premier?.capabilities).toContain("white-glove-delivery");
    expect(premier?.capabilities).toContain("signature-required");
    expect(premier?.capabilities).toContain("insurance-included");
  });

  it("at least one shipping template is director-approved", () => {
    const approved = shippingProviderTemplates.filter((t) => t.directorApproved);
    expect(approved.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Tax Provider Templates Tests
// ============================================================

describe("taxProviderTemplates", () => {
  it("contains expected tax providers", () => {
    const providers = taxProviderTemplates.map((t) => t.provider);
    expect(providers).toContain("taxjar");
    expect(providers).toContain("manual");
  });

  it("all templates have tax category", () => {
    for (const template of taxProviderTemplates) {
      expect(template.category).toBe("tax");
    }
  });

  it("TaxJar template has expected capabilities", () => {
    const taxjar = taxProviderTemplates.find(
      (t) => t.id === "core.tax.taxjar.standard"
    );
    expect(taxjar).toBeDefined();
    expect(taxjar?.capabilities).toContain("real-time-calculation");
    expect(taxjar?.capabilities).toContain("us-sales-tax");
    expect(taxjar?.capabilities).toContain("eu-vat");
  });

  it("Manual tax template has no external env vars", () => {
    const manual = taxProviderTemplates.find(
      (t) => t.id === "core.tax.manual.standard"
    );
    expect(manual).toBeDefined();
    expect(manual?.requiredEnvVars).toEqual([]);
    expect(manual?.capabilities).toContain("fixed-rate");
    expect(manual?.capabilities).toContain("region-based-rates");
  });
});

// ============================================================
// Combined Template Registry Tests
// ============================================================

describe("allProviderTemplates", () => {
  it("contains all payment, shipping, and tax templates", () => {
    const totalExpected =
      paymentProviderTemplates.length +
      shippingProviderTemplates.length +
      taxProviderTemplates.length;
    expect(allProviderTemplates.length).toBe(totalExpected);
  });

  it("all templates have unique IDs", () => {
    const ids = allProviderTemplates.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all templates are valid according to schema", () => {
    for (const template of allProviderTemplates) {
      expect(() => providerTemplateSchema.parse(template)).not.toThrow();
    }
  });
});

// ============================================================
// getProviderTemplate Tests
// ============================================================

describe("getProviderTemplate", () => {
  it("returns template by ID", () => {
    const template = getProviderTemplate("core.payment.stripe.standard");
    expect(template).toBeDefined();
    expect(template?.provider).toBe("stripe");
  });

  it("returns undefined for non-existent ID", () => {
    const template = getProviderTemplate("nonexistent.template");
    expect(template).toBeUndefined();
  });

  it("finds templates across all categories", () => {
    expect(getProviderTemplate("core.payment.stripe.standard")).toBeDefined();
    expect(getProviderTemplate("core.shipping.dhl.standard")).toBeDefined();
    expect(getProviderTemplate("core.tax.taxjar.standard")).toBeDefined();
  });
});

// ============================================================
// getProviderTemplatesByCategory Tests
// ============================================================

describe("getProviderTemplatesByCategory", () => {
  it("returns only payment templates for payment category", () => {
    const templates = getProviderTemplatesByCategory("payment");
    expect(templates.length).toBe(paymentProviderTemplates.length);
    for (const t of templates) {
      expect(t.category).toBe("payment");
    }
  });

  it("returns only shipping templates for shipping category", () => {
    const templates = getProviderTemplatesByCategory("shipping");
    expect(templates.length).toBe(shippingProviderTemplates.length);
    for (const t of templates) {
      expect(t.category).toBe("shipping");
    }
  });

  it("returns only tax templates for tax category", () => {
    const templates = getProviderTemplatesByCategory("tax");
    expect(templates.length).toBe(taxProviderTemplates.length);
    for (const t of templates) {
      expect(t.category).toBe("tax");
    }
  });
});

// ============================================================
// getProviderTemplatesByProvider Tests
// ============================================================

describe("getProviderTemplatesByProvider", () => {
  it("returns all Stripe templates", () => {
    const templates = getProviderTemplatesByProvider("stripe");
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      expect(t.provider).toBe("stripe");
    }
  });

  it("returns all DHL templates", () => {
    const templates = getProviderTemplatesByProvider("dhl");
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      expect(t.provider).toBe("dhl");
    }
  });

  it("returns empty array for non-existent provider", () => {
    const templates = getProviderTemplatesByProvider("nonexistent");
    expect(templates).toEqual([]);
  });
});

// ============================================================
// getDirectorApprovedTemplates Tests
// ============================================================

describe("getDirectorApprovedTemplates", () => {
  it("returns only director-approved templates", () => {
    const templates = getDirectorApprovedTemplates();
    for (const t of templates) {
      expect(t.directorApproved).toBe(true);
    }
  });

  it("returns approved templates filtered by category", () => {
    const paymentApproved = getDirectorApprovedTemplates("payment");
    for (const t of paymentApproved) {
      expect(t.directorApproved).toBe(true);
      expect(t.category).toBe("payment");
    }
  });

  it("returns approved shipping templates only", () => {
    const shippingApproved = getDirectorApprovedTemplates("shipping");
    for (const t of shippingApproved) {
      expect(t.directorApproved).toBe(true);
      expect(t.category).toBe("shipping");
    }
  });

  it("includes Stripe Standard in approved payment templates", () => {
    const approved = getDirectorApprovedTemplates("payment");
    const stripeStandard = approved.find(
      (t) => t.id === "core.payment.stripe.standard"
    );
    expect(stripeStandard).toBeDefined();
  });

  it("excludes Stripe Connect from approved templates", () => {
    const approved = getDirectorApprovedTemplates("payment");
    const stripeConnect = approved.find(
      (t) => t.id === "core.payment.stripe.connect"
    );
    expect(stripeConnect).toBeUndefined();
  });
});

// ============================================================
// validateProviderTemplate Tests
// ============================================================

describe("validateProviderTemplate", () => {
  it("returns valid for existing template with matching category", () => {
    const result = validateProviderTemplate(
      "core.payment.stripe.standard",
      "payment"
    );
    expect(result.valid).toBe(true);
  });

  it("returns invalid for non-existent template", () => {
    const result = validateProviderTemplate("nonexistent.template", "payment");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Template not found");
    }
  });

  it("returns invalid for category mismatch", () => {
    const result = validateProviderTemplate(
      "core.payment.stripe.standard",
      "shipping"
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("payment template, expected shipping");
    }
  });

  it("validates shipping template correctly", () => {
    const result = validateProviderTemplate(
      "core.shipping.dhl.standard",
      "shipping"
    );
    expect(result.valid).toBe(true);
  });

  it("validates tax template correctly", () => {
    const result = validateProviderTemplate(
      "core.tax.taxjar.standard",
      "tax"
    );
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// Template Content Validation Tests
// ============================================================

describe("template content validation", () => {
  it("all templates have valid docs URLs when present", () => {
    for (const template of allProviderTemplates) {
      if (template.docsUrl) {
        expect(() => new URL(template.docsUrl!)).not.toThrow();
      }
    }
  });

  it("all templates have webhook paths starting with /", () => {
    for (const template of allProviderTemplates) {
      if (template.webhookPath) {
        expect(template.webhookPath.startsWith("/")).toBe(true);
      }
    }
  });

  it("supported currencies are valid ISO 4217 format (3 uppercase letters)", () => {
    const currencyRegex = /^[A-Z]{3}$/;
    for (const template of allProviderTemplates) {
      if (template.supportedCurrencies) {
        for (const currency of template.supportedCurrencies) {
          expect(currency).toMatch(currencyRegex);
        }
      }
    }
  });

  it("supported countries are valid ISO 3166-1 alpha-2 format (2 uppercase letters)", () => {
    const countryRegex = /^[A-Z]{2}$/;
    for (const template of allProviderTemplates) {
      if (template.supportedCountries) {
        for (const country of template.supportedCountries) {
          expect(country).toMatch(countryRegex);
        }
      }
    }
  });

  it("all templates have non-empty ID, version, provider, label, description", () => {
    for (const template of allProviderTemplates) {
      expect(template.id.length).toBeGreaterThan(0);
      expect(template.version.length).toBeGreaterThan(0);
      expect(template.provider.length).toBeGreaterThan(0);
      expect(template.label.length).toBeGreaterThan(0);
      expect(template.description.length).toBeGreaterThan(0);
    }
  });
});
