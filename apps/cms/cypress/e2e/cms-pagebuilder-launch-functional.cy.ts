import "@testing-library/cypress/add-commands";

// PB-N09: Compose → publish → launch E2E using real Page Builder templates and launch SSE.
describe("CMS – Page Builder launch E2E", { tags: ["pb-launch", "pb-e2e", "functional"] }, () => {
  const shopId = `pb-launch-${Date.now()}`;
  const dataRoot = `${Cypress.env("TEST_DATA_ROOT") || "__tests__/data/shops"}`;
  const shopDir = `${dataRoot}/${shopId}`;
  const completed: Record<string, "pending" | "complete" | "skipped"> = {
    "shop-type": "complete",
    "shop-details": "complete",
    theme: "complete",
    tokens: "complete",
    "payment-provider": "complete",
    shipping: "complete",
    "checkout-page": "complete",
    inventory: "complete",
    "env-vars": "complete",
    hosting: "complete",
  };

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());

    cy.then(() => {
      const now = new Date().toISOString();
      const locales = { en: "Home", de: "", it: "" };
      const seo = {
        title: locales,
        description: { en: "", de: "", it: "" },
        image: { en: "", de: "", it: "" },
        brand: { en: "", de: "", it: "" },
        offers: { en: "", de: "", it: "" },
        aggregateRating: { en: "", de: "", it: "" },
      };

      const homePage = {
        id: "home",
        slug: "home",
        status: "draft",
        components: [],
        seo,
        createdAt: now,
        updatedAt: now,
        createdBy: "cypress",
      };

      const checkoutPage = {
        id: "checkout",
        slug: "checkout",
        status: "published",
        stableId: "core.page.checkout.shell",
        components: [
          { id: "checkout-section", type: "CheckoutSection", showWallets: true, showBNPL: true },
          { id: "checkout-cart", type: "CartSection", showPromo: true, showGiftCard: true },
        ],
        seo,
        createdAt: now,
        updatedAt: now,
        createdBy: "cypress",
      };

      const productPage = {
        id: "product",
        slug: "product",
        status: "published",
        stableId: "core.page.product.default",
        components: [{ id: "pdp-details", type: "PDPDetailsSection", preset: "default" }],
        seo,
        createdAt: now,
        updatedAt: now,
        createdBy: "cypress",
      };

      cy.writeFile(`${shopDir}/pages.json`, [homePage, productPage, checkoutPage]);
      cy.writeFile(`${shopDir}/products.json`, [
        {
          id: "p1",
          sku: "sku-1",
          status: "active",
          price: 100,
          currency: "USD",
          title: { en: "PB Launch Product", de: "", it: "" },
          description: { en: "", de: "", it: "" },
          media: [],
          shop: shopId,
          row_version: 1,
          created_at: now,
          updated_at: now,
        },
      ]);
      cy.writeFile(`${shopDir}/inventory.json`, [
        { sku: "sku-1", productId: "p1", quantity: 5, variantAttributes: {} },
      ]);
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
        name: `PB Launch ${shopId}`,
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
    });

    cy.request("PUT", "/cms/api/configurator-progress", {
      stepId: "shop-details",
      data: {
        shopId,
        storeName: `PB Launch ${shopId}`,
        payment: ["testpay"],
        shipping: ["test-ship"],
        navItems: [{ id: "home", label: "Home", url: "https://example.com/home" }],
        pages: [
          {
            id: "home",
            slug: "home",
            title: { en: "Home", de: "", it: "" },
            description: { en: "", de: "", it: "" },
            image: { en: "", de: "", it: "" },
            components: [],
          },
        ],
        checkoutComponents: [{ id: "checkout-section", type: "CheckoutSection" }],
      },
    });

    cy.request("PUT", "/cms/api/configurator-progress", { completed });
  });

  it("composes a template, publishes, and completes launch SSE", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());

    // Compose from template and publish in Page Builder
    cy.pbVisitBuilder(shopId, "home");
    cy.get('[data-cy="template-actions-trigger"]').click();
    cy.get('[role="combobox"]').click();
    cy.get('[data-cy="template-core.page.home.default"]').click();
    cy.contains("button", /Apply/i).click();

    cy.pbEnsurePaletteOpen();
    cy.pbDragPaletteToCanvas("Text");

    cy.contains("button", /^Save$/i).click();
    cy.contains("button", /^Publish$/i).click();

    cy.readFile(`${shopDir}/pages.json`, { timeout: 10000 }).then((pages) => {
      const home = pages.find((p: { slug?: string }) => p.slug === "home") as {
        status?: string;
        stableId?: string;
        components?: unknown[];
        seo?: Record<string, unknown>;
      };
      expect(home?.status).to.eq("published");
      expect(home?.stableId).to.match(/core\.page\.home\./);
      expect((home?.components || []).length).to.be.greaterThan(0);

      const toLocaleRecord = (val: unknown, fallback = "") => {
        if (val && typeof val === "object" && "en" in (val as Record<string, unknown>)) {
          const rec = val as Record<string, string>;
          return { en: rec.en || fallback, de: rec.de || "", it: rec.it || "" };
        }
        if (typeof val === "string") {
          return { en: val, de: "", it: "" };
        }
        return { en: fallback, de: "", it: "" };
      };

      const pageInfos = pages.map(
        (p: { id?: string; slug?: string; seo?: any; components?: any[] }) => ({
          id: p.id || p.slug || "",
          slug: p.slug || "",
          title: toLocaleRecord(p.seo?.title, p.slug || "Page"),
          description: toLocaleRecord(p.seo?.description, ""),
          image: toLocaleRecord(p.seo?.image, ""),
          components: Array.isArray(p.components) ? p.components : [],
        }),
      );

      // Launch via real SSE stream using current page state so ConfigChecks stay satisfied
      const csrf = `test-${Date.now()}`;
      cy.setCookie("csrf_token", csrf);
      cy.request({
        method: "POST",
        url: "/api/launch-shop",
        headers: { "x-csrf-token": csrf },
        body: {
          shopId,
          state: {
            shopId,
            completed,
            navItems: [{ id: "home", label: "Home", url: "https://example.com/home" }],
            payment: ["testpay"],
            shipping: ["test-ship"],
            pages: pageInfos,
            checkoutComponents:
              pageInfos.find((p: { slug?: string }) => p.slug === "checkout")?.components ?? [],
          },
          seed: false,
        },
        timeout: 120000,
      }).then((res) => {
        const body = typeof res.body === "string" ? res.body : String(res.body || "");
        const lines = body
          .trim()
          .split("\n\n")
          .filter(Boolean)
          .map((line: string) => JSON.parse(line.replace(/^data:\s*/, "")));
        const statuses = Object.fromEntries(
          lines.filter((m: any) => m.step && m.status).map((m: any) => [m.step, m.status]),
        );
        expect(statuses.create).to.eq("success");
        expect(statuses.init).to.eq("success");
        expect(statuses.deploy).to.eq("success");
        expect(statuses.tests).to.eq("success");
        expect(lines.some((m: any) => m.done === true)).to.eq(true);
      });
    });

    cy.readFile(`${shopDir}/deploy.json`, { timeout: 10000 }).its("status").should("eq", "success");
  });
});
