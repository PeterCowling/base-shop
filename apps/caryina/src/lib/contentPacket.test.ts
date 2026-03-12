import { getChromeContent } from "./contentPacket";

/**
 * Locale-resolution tests for getChromeContent.
 *
 * readPayload() is private and not mockable. After TASK-01 removed the `chrome`
 * key from site-content.generated.json, readPayload().chrome is undefined and
 * getChromeContent falls back to CHROME_DEFAULTS automatically. No mocking needed.
 */

describe("getChromeContent — DE locale", () => {
  const de = getChromeContent("de");

  test("header: navAriaLabel is German", () => {
    expect(de.header.navAriaLabel).toBe("Hauptnavigation");
  });

  test("header: support is German", () => {
    expect(de.header.support).toBe("Support");
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

  test("header: support is Supporto", () => {
    expect(it.header.support).toBe("Supporto");
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

  // TC-05
  test("footer: terms is Terms", () => {
    expect(en.footer.terms).toBe("Terms");
  });

  test("footer: returnsRefunds is English", () => {
    expect(en.footer.returnsRefunds).toBe("Returns & Refunds");
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
