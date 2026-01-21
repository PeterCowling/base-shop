import { HttpResponse } from "msw";

import { getCartLineItems, getCartTotals } from "@/lib/cart";
import {
  getAvailableColors,
  getAvailableSizes,
  getColorHex,
  getDefaultVariant,
  getProductBySlug,
  getProducts,
  getVariantById,
  getVariantBySelection,
} from "@/lib/catalog";
import { createCheckoutSession, fetchCheckoutSession } from "@/lib/checkout";
import { getPreferredLocale, setPreferredLocale } from "@/lib/localePreference";
import {
  DEFAULT_LOCALE,
  getLocaleFromPath,
  isLocale,
  LOCALES,
  resolveLocale,
  toIntlLocale,
} from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { formatPrice } from "@/lib/pricing";
import { clampQuantity, MAX_QTY, MIN_QTY } from "@/lib/quantity";
import {
  getCanonicalPath,
  replaceLocaleInPath,
  stripLocale,
  withLocale,
} from "@/lib/routes";
import { buildMetadata } from "@/lib/seo";
import type { CartState } from "@/types/cart";
import type { Product, ProductColor } from "@/types/product";

import { rest, server } from "~test/msw/server";

describe("locales", () => {
  it("validates and resolves locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("nope")).toBe(false);
    expect(resolveLocale(["it"])).toBe("it");
    expect(resolveLocale("nope")).toBe(DEFAULT_LOCALE);
  });

  it("parses locale from paths and formats intl locale", () => {
    expect(getLocaleFromPath("/it/shop")).toBe("it");
    expect(getLocaleFromPath("/shop")).toBe(DEFAULT_LOCALE);
    expect(toIntlLocale("it")).toBe("it-IT");
    expect(toIntlLocale("en")).toBe("en-US");
  });

  it("exposes locales list", () => {
    expect(LOCALES).toEqual(["en", "it"]);
  });
});

describe("routes", () => {
  it("strips locale prefixes", () => {
    expect(stripLocale("/en/shop")).toBe("/shop");
    expect(stripLocale("/shop")).toBe("/shop");
    expect(stripLocale("/")).toBe("/");
  });

  it("adds and replaces locales", () => {
    expect(withLocale("/shop", "en")).toBe("/en/shop");
    expect(replaceLocaleInPath("shop", "it")).toBe("/it/shop");
  });

  it("builds canonical paths", () => {
    expect(getCanonicalPath("en", "/shop")).toBe("/en/shop");
    expect(getCanonicalPath("it", "/")).toBe("/it");
  });
});

describe("messages", () => {
  it("loads localized messages", async () => {
    const en = await loadMessages("en");
    const it = await loadMessages("it");
    expect(en["home.hero.title"]).toBeTruthy();
    expect(it["language.switch"]).toBeTruthy();
  });

  it("creates translators with variable replacement", () => {
    const t = createTranslator({ "greeting": "Hello {name}" });
    expect(t("greeting", { name: "Sam" })).toBe("Hello Sam");
    expect(t("missing")).toBe("missing");
  });
});

describe("api", () => {
  it("builds api urls with configured base", () => {
    const original = process.env.NEXT_PUBLIC_API_BASE_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com";
    jest.resetModules();
    const { buildApiUrl } = require("@/lib/api");
    expect(buildApiUrl("/api/test")).toBe("https://example.com/api/test");
    process.env.NEXT_PUBLIC_API_BASE_URL = original;
  });
});

describe("pricing", () => {
  it("formats prices with currency", () => {
    const label = formatPrice(1234, "USD", "en-US");
    expect(label).toContain("12.34");
    expect(label).toMatch(/\$/);
  });
});

describe("catalog", () => {
  const products = getProducts();

  it("finds products and variants", () => {
    const classic = getProductBySlug("classic");
    expect(classic?.slug).toBe("classic");
    const variant = getVariantById("classic-kids-sand");
    expect(variant?.size).toBe("kids");
  });

  it("selects variants by size and color", () => {
    const product = products[0];
    const variant = getVariantBySelection(product, "kids", "sand");
    expect(variant?.id).toBe("classic-kids-sand");
  });

  it("returns default variants and available options", () => {
    const product = products[0];
    const defaultVariant = getDefaultVariant(product);
    expect(defaultVariant.inStock).toBe(true);
    expect(getAvailableSizes(product)).toEqual(["kids", "adult"]);
    expect(getAvailableColors(product)).toEqual(["sand", "ocean", "berry"]);
  });

  it("handles missing variants gracefully", () => {
    const emptyProduct: Product = {
      id: "empty",
      slug: "empty",
      name: "Empty",
      style: "Empty",
      shortDescription: "Empty",
      longDescription: "Empty",
      featureBullets: [],
      materials: [],
      careInstructions: [],
      compatibilityNotes: [],
      images: [],
      variants: [],
    };
    expect(() => getDefaultVariant(emptyProduct)).toThrow("Product has no variants");
  });

  it("returns fallback color values", () => {
    expect(getColorHex("sand")).toContain("var");
    expect(getColorHex("unknown" as ProductColor)).toContain("var");
  });
});

describe("cart helpers", () => {
  it("computes totals and ignores unknown variants", () => {
    const state: CartState = {
      items: [
        { variantId: "classic-kids-sand", quantity: 2 },
        { variantId: "unknown", quantity: 1 },
      ],
      updatedAt: 0,
    };
    const totals = getCartTotals(state);
    expect(totals.itemCount).toBe(2);
    expect(totals.subtotal).toBe(6800);
    expect(totals.currency).toBe("USD");
  });

  it("builds cart line items", () => {
    const lineItems = getCartLineItems([{ variantId: "classic-kids-sand", quantity: 1 }]);
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].product.slug).toBe("classic");
  });
});

describe("seo", () => {
  it("builds metadata with open graph data", () => {
    const metadata = buildMetadata({
      locale: "en",
      title: "Title",
      description: "Description",
      path: "/shop",
      openGraph: {
        title: "Title",
        description: "Description",
        url: "https://example.com/en/shop",
        type: "website",
        image: {
          url: "https://example.com/og.png",
          width: 1200,
          height: 630,
          alt: "OG",
        },
      },
    });

    expect(metadata.alternates?.canonical).toContain("/en/shop");
    expect(metadata.openGraph?.images?.[0]?.url).toBe("https://example.com/og.png");
  });

  it("omits open graph images when none provided", () => {
    const metadata = buildMetadata({
      locale: "en",
      title: "Title",
      description: "Description",
      path: "/faq",
      openGraph: {
        title: "Title",
        description: "Description",
        url: "https://example.com/en/faq",
        type: "website",
      },
    });

    expect(metadata.openGraph?.images).toBeUndefined();
  });
});

describe("locale preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads and writes preferred locale", () => {
    expect(getPreferredLocale()).toBeNull();
    setPreferredLocale("it");
    expect(getPreferredLocale()).toBe("it");
  });

  it("falls back to default locale on invalid storage", () => {
    localStorage.setItem("cochlearfit:locale", "bad");
    expect(getPreferredLocale()).toBe(DEFAULT_LOCALE);
  });
});

describe("checkout helpers", () => {
  it("creates checkout sessions", async () => {
    server.use(
      rest.post("/api/checkout/session", () =>
        HttpResponse.json({ id: "sess_1", url: "https://stripe.test" })
      )
    );

    const response = await createCheckoutSession({
      items: [{ variantId: "classic-kids-sand", quantity: 1 }],
      locale: "en",
    });

    expect(response.url).toBe("https://stripe.test");
  });

  it("throws on checkout session failures", async () => {
    server.use(
      rest.post("/api/checkout/session", () => new HttpResponse(null, { status: 500 }))
    );
    await expect(
      createCheckoutSession({
        items: [{ variantId: "classic-kids-sand", quantity: 1 }],
        locale: "en",
      })
    ).rejects.toThrow("Failed to create checkout session");
  });

  it("fetches checkout sessions", async () => {
    server.use(
      rest.get("/api/checkout/session/:id", () =>
        HttpResponse.json({
          id: "sess_1",
          paymentStatus: "paid",
          items: [],
          total: 0,
          currency: "USD",
        })
      )
    );

    const response = await fetchCheckoutSession("sess_1");
    expect(response.id).toBe("sess_1");
  });

  it("throws when session fetch fails", async () => {
    server.use(
      rest.get("/api/checkout/session/:id", () => new HttpResponse(null, { status: 500 }))
    );
    await expect(fetchCheckoutSession("sess_1")).rejects.toThrow(
      "Failed to fetch checkout session"
    );
  });
});

describe("quantity", () => {
  it("clamps quantities within bounds", () => {
    expect(clampQuantity(Number.NaN)).toBe(MIN_QTY);
    expect(clampQuantity(0)).toBe(MIN_QTY);
    expect(clampQuantity(MAX_QTY + 2)).toBe(MAX_QTY);
    expect(clampQuantity(4.7)).toBe(4);
  });
});
