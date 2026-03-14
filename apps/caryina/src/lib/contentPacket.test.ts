import { getAboutContent, getChromeContent } from "./contentPacket";

/**
 * Locale-resolution tests for getChromeContent.
 *
 * readPayload() is private and not mockable. After TASK-01 removed the `chrome`
 * key from site-content.generated.json, readPayload().chrome is undefined and
 * getChromeContent falls back to CHROME_DEFAULTS automatically. No mocking needed.
 */

/**
 * Fallback path tests for readPayload().
 *
 * These tests use jest.isolateModules() to get fresh module instances with a
 * clean cachedPayload so each test exercises the fallback path independently.
 * The node:fs module is mocked inside each isolateModules block.
 */
describe("readPayload — fallback paths", () => {
  test("TC-01: missing file — getHomeContent returns SAFE_DEFAULTS and warns", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      jest.isolateModules(() => {
        jest.mock("node:fs", () => ({
          existsSync: () => false,
          readFileSync: jest.fn(),
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        }));
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require("./contentPacket") as typeof import("./contentPacket");
        const result = mod.getHomeContent("en");
        expect(result.heading).toBeTruthy();
        expect(typeof result.heading).toBe("string");
        expect(result.heading.length).toBeGreaterThan(0);
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing generated site-content payload"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("TC-02: malformed JSON — getHomeContent returns SAFE_DEFAULTS and warns", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      jest.isolateModules(() => {
        jest.mock("node:fs", () => ({
          existsSync: (p: string) => p.includes("data/shops/caryina"),
          readFileSync: () => "invalid{json",
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        }));
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require("./contentPacket") as typeof import("./contentPacket");
        const result = mod.getHomeContent("en");
        expect(result.heading).toBeTruthy();
        expect(typeof result.heading).toBe("string");
        expect(result.heading.length).toBeGreaterThan(0);
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid generated site-content payload"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe("getAboutContent", () => {
  test("en locale — title is About Caryina", () => {
    expect(getAboutContent("en").title).toBe("About Caryina");
  });

  test("en locale — eyebrow contains Designed in Positano", () => {
    expect(getAboutContent("en").eyebrow).toBe("Designed in Positano, Italy");
  });

  test("en locale — summary is non-empty string", () => {
    const result = getAboutContent("en");
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  });

  test("en locale — paragraphs is array of strings", () => {
    const result = getAboutContent("en");
    expect(Array.isArray(result.paragraphs)).toBe(true);
    expect(result.paragraphs.length).toBeGreaterThan(0);
    result.paragraphs.forEach((p) => expect(typeof p).toBe("string"));
  });

  test("de locale — title is Über Caryina", () => {
    expect(getAboutContent("de").title).toBe("Über Caryina");
  });

  test("de locale — eyebrow is German Positano phrase", () => {
    expect(getAboutContent("de").eyebrow).toBe("Entworfen in Positano, Italien");
  });

  test("it locale — title is Chi siamo", () => {
    expect(getAboutContent("it").title).toBe("Chi siamo");
  });

  test("it locale — eyebrow is Italian Positano phrase", () => {
    expect(getAboutContent("it").eyebrow).toBe("Progettato a Positano, Italia");
  });

  test("all locales — no 'Made in Italy' phrase appears", () => {
    for (const locale of ["en", "de", "it"] as const) {
      const result = getAboutContent(locale);
      const allText = [result.title, result.eyebrow, result.summary, ...result.paragraphs].join(" ");
      expect(allText.toLowerCase()).not.toContain("made in italy");
    }
  });
});

describe("getAboutContent — malformed about: {} degraded path", () => {
  test("returns SAFE_DEFAULTS values when about fields are undefined", () => {
    jest.isolateModules(() => {
      const jsonWithEmptyAbout = JSON.stringify({
        sourcePaths: [],
        seoKeywords: [],
        home: { eyebrow: { en: "x" }, heading: { en: "x" }, summary: { en: "x" }, ctaPrimary: { en: "x" }, ctaSecondary: { en: "x" }, seoHeading: { en: "x" }, seoBody: { en: "x" }, faqHeading: { en: "x" }, faqItems: [] },
        shop: { eyebrow: { en: "x" }, heading: { en: "x" }, summary: { en: "x" }, trustBullets: [] },
        launchFamilies: { "top-handle": { label: { en: "x" }, description: { en: "x" } }, shoulder: { label: { en: "x" }, description: { en: "x" } }, mini: { label: { en: "x" }, description: { en: "x" } } },
        productPage: { proofHeading: { en: "x" }, proofBullets: [], relatedHeading: { en: "x" } },
        support: { title: { en: "x" }, summary: { en: "x" }, channels: [], responseSla: { en: "x" } },
        policies: { privacy: { title: { en: "x" }, summary: { en: "x" }, bullets: [] }, shipping: { title: { en: "x" }, summary: { en: "x" }, bullets: [] }, returns: { title: { en: "x" }, summary: { en: "x" }, bullets: [] }, terms: { title: { en: "x" }, summary: { en: "x" }, bullets: [] } },
        about: {},
      });
      jest.mock("node:fs", () => ({
        existsSync: (p: string) => p.includes("data/shops/caryina"),
        readFileSync: () => jsonWithEmptyAbout,
        mkdirSync: jest.fn(),
        writeFileSync: jest.fn(),
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("./contentPacket") as typeof import("./contentPacket");
      const result = mod.getAboutContent("en");
      expect(typeof result.title).toBe("string");
      expect(result.title.length).toBeGreaterThan(0);
      expect(typeof result.eyebrow).toBe("string");
      expect(result.eyebrow.length).toBeGreaterThan(0);
      expect(Array.isArray(result.paragraphs)).toBe(true);
      expect(result.paragraphs.length).toBeGreaterThan(0);
    });
  });
});

describe("getChromeContent — DE locale", () => {
  const de = getChromeContent("de");

  test("header: navAriaLabel is German", () => {
    expect(de.header.navAriaLabel).toBe("Hauptnavigation");
  });

  test("header: about is Über uns", () => {
    expect(de.header.about).toBe("Über uns");
  });

  test("header: support is German", () => {
    expect(de.header.support).toBe("Support");
  });

  test("footer: about is Über uns", () => {
    expect(de.footer.about).toBe("Über uns");
  });

  // TC-01
  test("footer: terms is AGB", () => {
    expect(de.footer.terms).toBe("AGB");
  });

  // TC-02
  test("footer: returnsRefunds is German", () => {
    expect(de.footer.returnsRefunds).toBe("Rücksendungen & Erstattungen");
  });

  test("footer: privacy is Datenschutz", () => {
    expect(de.footer.privacy).toBe("Datenschutz");
  });

  test("footer: cookie is Cookies", () => {
    expect(de.footer.cookie).toBe("Cookies");
  });

  test("footer: shipping is Versand", () => {
    expect(de.footer.shipping).toBe("Versand");
  });

  test("footer: copyright is German", () => {
    expect(de.footer.copyright).toBe("Alle Rechte vorbehalten.");
  });

  test("consent: decline is Ablehnen", () => {
    expect(de.consent.decline).toBe("Ablehnen");
  });

  test("consent: accept is Akzeptieren", () => {
    expect(de.consent.accept).toBe("Akzeptieren");
  });

  test("consent: privacyLink is Datenschutzerklärung", () => {
    expect(de.consent.privacyLink).toBe("Datenschutzerklärung");
  });

  test("consent: cookieLink is Cookie-Richtlinie", () => {
    expect(de.consent.cookieLink).toBe("Cookie-Richtlinie");
  });

  test("trust: shippingLink is Versandrichtlinie", () => {
    expect(de.trust.shippingLink).toBe("Versandrichtlinie");
  });

  test("trust: returnsLink is German", () => {
    expect(de.trust.returnsLink).toBe("Rücksendungen & Umtausch");
  });

  // TC-06
  test("notifyMe: submit is Benachrichtige mich", () => {
    expect(de.notifyMe.submit).toBe("Benachrichtige mich");
  });

  test("notifyMe: emailLabel is E-Mail", () => {
    expect(de.notifyMe.emailLabel).toBe("E-Mail");
  });
});

describe("getChromeContent — IT locale", () => {
  const it = getChromeContent("it");

  test("header: navAriaLabel is Italian", () => {
    expect(it.header.navAriaLabel).toBe("Navigazione principale");
  });

  test("header: about is Chi siamo", () => {
    expect(it.header.about).toBe("Chi siamo");
  });

  test("header: support is Supporto", () => {
    expect(it.header.support).toBe("Supporto");
  });

  test("footer: about is Chi siamo", () => {
    expect(it.footer.about).toBe("Chi siamo");
  });

  // TC-03
  test("footer: terms is Termini", () => {
    expect(it.footer.terms).toBe("Termini");
  });

  test("footer: returnsRefunds is Italian", () => {
    expect(it.footer.returnsRefunds).toBe("Resi e Rimborsi");
  });

  test("footer: privacy is Privacy", () => {
    expect(it.footer.privacy).toBe("Privacy");
  });

  test("footer: cookie is Cookie", () => {
    expect(it.footer.cookie).toBe("Cookie");
  });

  test("footer: shipping is Spedizione", () => {
    expect(it.footer.shipping).toBe("Spedizione");
  });

  test("footer: copyright is Italian", () => {
    expect(it.footer.copyright).toBe("Tutti i diritti riservati.");
  });

  // TC-04
  test("consent: decline is Rifiuta", () => {
    expect(it.consent.decline).toBe("Rifiuta");
  });

  test("consent: accept is Accetta", () => {
    expect(it.consent.accept).toBe("Accetta");
  });

  test("consent: privacyLink is Italian", () => {
    expect(it.consent.privacyLink).toBe("informativa sulla privacy");
  });

  test("consent: cookieLink is Italian", () => {
    expect(it.consent.cookieLink).toBe("cookie policy");
  });

  // TC-07
  test("trust: shippingLink is Politica di spedizione", () => {
    expect(it.trust.shippingLink).toBe("Politica di spedizione");
  });

  test("trust: returnsLink is Italian", () => {
    expect(it.trust.returnsLink).toBe("Resi e cambi");
  });

  test("notifyMe: submit is Avvisami", () => {
    expect(it.notifyMe.submit).toBe("Avvisami");
  });

  test("notifyMe: emailLabel is Email", () => {
    expect(it.notifyMe.emailLabel).toBe("Email");
  });
});

describe("getChromeContent — EN locale (unchanged)", () => {
  const en = getChromeContent("en");

  test("header: about is About", () => {
    expect(en.header.about).toBe("About");
  });

  test("footer: about is About", () => {
    expect(en.footer.about).toBe("About");
  });

  // TC-05
  test("footer: terms is Terms", () => {
    expect(en.footer.terms).toBe("Terms");
  });

  test("footer: returnsRefunds is English", () => {
    expect(en.footer.returnsRefunds).toBe("Returns & Refunds");
  });

  test("footer: cookie is English", () => {
    expect(en.footer.cookie).toBe("Cookies");
  });

  test("header: shop is Shop", () => {
    expect(en.header.shop).toBe("Shop");
  });

  test("header: navAriaLabel is Primary", () => {
    expect(en.header.navAriaLabel).toBe("Primary");
  });

  test("consent: decline is Decline", () => {
    expect(en.consent.decline).toBe("Decline");
  });

  test("consent: accept is Accept", () => {
    expect(en.consent.accept).toBe("Accept");
  });

  test("trust: shippingLink is Shipping policy", () => {
    expect(en.trust.shippingLink).toBe("Shipping policy");
  });

  test("notifyMe: submit is Notify me", () => {
    expect(en.notifyMe.submit).toBe("Notify me");
  });
});
