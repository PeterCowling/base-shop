/**
 * Tests for LAUNCH-28 + LAUNCH-14: Provider Templates API
 */

import { GET } from "../route";

// Mock NextRequest for testing
function createMockRequest(url: string) {
  return { url } as unknown as Parameters<typeof GET>[0];
}

describe("GET /api/provider-templates", () => {
  describe("without filters", () => {
    it("returns all provider templates", async () => {
      const response = await GET(createMockRequest("http://localhost/api/provider-templates"));
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Should include payment, shipping, and tax templates
      const categories = new Set(data.map((t: { category: string }) => t.category));
      expect(categories.has("payment")).toBe(true);
      expect(categories.has("shipping")).toBe(true);
      expect(categories.has("tax")).toBe(true);
    });

    it("returns templates with expected structure", async () => {
      const response = await GET(createMockRequest("http://localhost/api/provider-templates"));
      const data = await response.json();

      const firstTemplate = data[0];
      expect(firstTemplate).toHaveProperty("id");
      expect(firstTemplate).toHaveProperty("version");
      expect(firstTemplate).toHaveProperty("provider");
      expect(firstTemplate).toHaveProperty("label");
      expect(firstTemplate).toHaveProperty("description");
      expect(firstTemplate).toHaveProperty("category");
      expect(firstTemplate).toHaveProperty("capabilities");
      expect(firstTemplate).toHaveProperty("requiredEnvVars");
      expect(firstTemplate).toHaveProperty("optionalEnvVars");
      expect(firstTemplate).toHaveProperty("directorApproved");
      expect(firstTemplate).toHaveProperty("origin");
    });
  });

  describe("with category filter", () => {
    it("returns only payment templates when category=payment", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=payment")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.category).toBe("payment");
      }
    });

    it("returns only shipping templates when category=shipping", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=shipping")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.category).toBe("shipping");
      }
    });

    it("returns only tax templates when category=tax", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=tax")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.category).toBe("tax");
      }
    });

    it("handles case-insensitive category filter", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=PAYMENT")
      );
      const data = await response.json();

      for (const template of data) {
        expect(template.category).toBe("payment");
      }
    });
  });

  describe("with provider filter", () => {
    it("returns only Stripe templates when provider=stripe", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?provider=stripe")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.provider).toBe("stripe");
      }
    });

    it("returns only DHL templates when provider=dhl", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?provider=dhl")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.provider).toBe("dhl");
      }
    });

    it("handles case-insensitive provider filter", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?provider=STRIPE")
      );
      const data = await response.json();

      for (const template of data) {
        expect(template.provider).toBe("stripe");
      }
    });

    it("returns empty array for non-existent provider", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?provider=nonexistent")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe("with approved filter", () => {
    it("returns only director-approved templates when approved=true", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?approved=true")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      for (const template of data) {
        expect(template.directorApproved).toBe(true);
      }
    });

    it("returns all templates when approved filter is not set", async () => {
      const responseAll = await GET(
        createMockRequest("http://localhost/api/provider-templates")
      );
      const responseApproved = await GET(
        createMockRequest("http://localhost/api/provider-templates?approved=true")
      );

      const allData = await responseAll.json();
      const approvedData = await responseApproved.json();

      // All templates should include some non-approved ones
      expect(allData.length).toBeGreaterThanOrEqual(approvedData.length);
    });

    it("excludes non-approved templates when approved=true", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=payment&approved=true")
      );
      const data = await response.json();

      // Stripe Connect is not director-approved
      const stripeConnect = data.find(
        (t: { id: string }) => t.id === "core.payment.stripe.connect"
      );
      expect(stripeConnect).toBeUndefined();
    });
  });

  describe("with combined filters", () => {
    it("combines category and approved filters", async () => {
      const response = await GET(
        createMockRequest(
          "http://localhost/api/provider-templates?category=shipping&approved=true"
        )
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      for (const template of data) {
        expect(template.category).toBe("shipping");
        expect(template.directorApproved).toBe(true);
      }
    });

    it("combines provider and category filters", async () => {
      const response = await GET(
        createMockRequest(
          "http://localhost/api/provider-templates?provider=stripe&category=payment"
        )
      );
      const data = await response.json();

      for (const template of data) {
        expect(template.provider).toBe("stripe");
        expect(template.category).toBe("payment");
      }
    });

    it("combines all three filters", async () => {
      const response = await GET(
        createMockRequest(
          "http://localhost/api/provider-templates?category=payment&provider=stripe&approved=true"
        )
      );
      const data = await response.json();

      for (const template of data) {
        expect(template.provider).toBe("stripe");
        expect(template.category).toBe("payment");
        expect(template.directorApproved).toBe(true);
      }

      // Should include Stripe Standard but not Stripe Connect
      const ids = data.map((t: { id: string }) => t.id);
      expect(ids).toContain("core.payment.stripe.standard");
      expect(ids).not.toContain("core.payment.stripe.connect");
    });
  });

  describe("response format", () => {
    it("normalizes optional fields to default values", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates")
      );
      const data = await response.json();

      for (const template of data) {
        expect(Array.isArray(template.optionalEnvVars)).toBe(true);
        expect(Array.isArray(template.requiredConfig)).toBe(true);
        expect(Array.isArray(template.supportedCurrencies)).toBe(true);
        expect(Array.isArray(template.supportedCountries)).toBe(true);
      }
    });

    it("includes null for missing optional scalar fields", async () => {
      const response = await GET(
        createMockRequest("http://localhost/api/provider-templates?category=tax")
      );
      const data = await response.json();

      // Manual tax template has no webhook path
      const manualTax = data.find(
        (t: { id: string }) => t.id === "core.tax.manual.standard"
      );
      expect(manualTax.webhookPath).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles request with no URL gracefully", async () => {
      const response = await GET(undefined);
      const data = await response.json();

      // Should return all templates when no params
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it("ignores unknown query parameters", async () => {
      const response = await GET(
        createMockRequest(
          "http://localhost/api/provider-templates?unknown=value&foo=bar"
        )
      );
      const data = await response.json();

      // Should still return all templates
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
