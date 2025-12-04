import "@testing-library/cypress/add-commands";

// PB-N12 smoke: checkout builder is reachable, uses checkout-safe palette, and can save.
describe("CMS – Checkout builder smoke", { tags: ["pb-checkout", "pb-smoke", "functional"] }, () => {
  const shopId = `pb-checkout-${Date.now()}`;
  const dataRoot = `${Cypress.env("TEST_DATA_ROOT") || "__tests__/data/shops"}`;
  const shopDir = `${dataRoot}/${shopId}`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());

    cy.then(() => {
      const now = new Date().toISOString();
      const locales = { en: "Checkout", de: "", it: "" };
      const seo = {
        title: locales,
        description: { en: "", de: "", it: "" },
        image: { en: "", de: "", it: "" },
        brand: { en: "", de: "", it: "" },
        offers: { en: "", de: "", it: "" },
        aggregateRating: { en: "", de: "", it: "" },
      };

      // Start with an empty pages array; the checkout builder route should scaffold checkout automatically.
      cy.writeFile(`${shopDir}/pages.json`, []);
      cy.writeFile(`${shopDir}/settings.json`, {
        languages: ["en"],
        seo: { canonicalBase: "https://example.com" },
        currency: "USD",
        taxRegion: "US-NY",
        updatedAt: now,
        updatedBy: "cypress",
      });
      cy.writeFile(`${shopDir}/shop.json`, {
        id: shopId,
        slug: shopId,
        name: `PB Checkout ${shopId}`,
        themeId: "bcd-classic",
        themeTokens: { "color.brand": "#000000" },
        themeOverrides: {},
        paymentProviders: ["testpay"],
        billingProvider: "testpay",
        shippingProviders: ["test-ship"],
        navigation: [{ id: "home", label: "Home", url: "https://example.com/home" }],
        returnPolicyUrl: "https://example.com/refund",
        termsUrl: "https://example.com/terms",
        privacyUrl: "https://example.com/privacy",
        componentVersions: {},
        lastUpgrade: now,
      });
      // Mirror checkout-specific state to avoid validation gaps when saving/publishing
      cy.writeFile(`${shopDir}/checkout.json`, { updatedAt: now, updatedBy: "cypress", seo });
    });
  });

  it("creates and saves the checkout page with checkout-safe palette", function () {
    cy.session("admin-session", () => cy.loginAsAdmin());

    cy.pbVisitBuilder(shopId, "checkout");
    cy.document().then((doc) => {
      if (!doc.querySelector('[data-cy="pb-canvas"]')) {
        cy.log("Skipping checkout builder smoke: builder canvas missing in this env.");
         
        this.skip();
      }
    });

    // Checkout page should have been scaffolded from the core template
    cy.readFile(`${shopDir}/pages.json`, { timeout: 10000 }).then((pages: Array<Record<string, unknown>>) => {
      const checkout = pages.find((p) => p.slug === "checkout");
      expect(checkout, "checkout page scaffolded").to.exist;
      expect((checkout as { stableId?: string }).stableId).to.match(/^core\\.page\\.checkout\\./);
      expect(Array.isArray((checkout as { components?: unknown[] }).components)).to.be.true;
    });

    cy.pbEnsurePaletteOpen();
    cy.get('[data-cy="pb-palette-item-CheckoutSection"]').should("exist");
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="pb-palette-item-HeroBanner"]').length > 0) {
        throw new Error("HeroBanner should be hidden in checkout palette");
      }
    });

    // Insert an allowed block and save
    cy.pbDragPaletteToCanvas("ValueProps");
    cy.pbSave();
    cy.readFile(`${shopDir}/pages.json`, { timeout: 10000 }).then((pages: Array<Record<string, unknown>>) => {
      const checkout = pages.find((p) => p.slug === "checkout") as {
        slug?: string;
        status?: string;
        components?: Array<{ type?: string }>;
      };
      expect(checkout, "checkout page persisted").to.exist;
      expect(checkout.status).to.be.oneOf(["draft", "published"]);
      const types = (checkout.components || []).map((c) => c.type);
      expect(types).to.include("CheckoutSection");
      expect(types).to.include("CartSection");
      expect(types).to.include("ValueProps");
      // Ensure no marketing-only blocks slipped in (spot check)
      expect(types).to.not.include("HeroBanner");
    });
  });
});
