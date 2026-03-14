import * as fs from "node:fs";
import * as path from "node:path";

import type { Locale } from "@acme/i18n/locales";

interface LocalizedText {
  en: string;
  de?: string;
  it?: string;
}

type TrustStripCopy = {
  delivery: LocalizedText;
  exchange: LocalizedText;
  origin: LocalizedText;
  securePayment: LocalizedText;
};

interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

interface PolicyCopy {
  title: LocalizedText;
  summary: LocalizedText;
  bullets: LocalizedText[];
  notice?: LocalizedText;
}

interface AboutContent {
  title: LocalizedText;
  eyebrow: LocalizedText;
  summary: LocalizedText;
  paragraphs: LocalizedText[];
}

interface ChromeContent {
  header: {
    shop: LocalizedText;
    about: LocalizedText;
    support: LocalizedText;
    navAriaLabel: LocalizedText;
  };
  footer: {
    about: LocalizedText;
    terms: LocalizedText;
    privacy: LocalizedText;
    cookie: LocalizedText;
    returnsRefunds: LocalizedText;
    shipping: LocalizedText;
    support: LocalizedText;
    copyright: LocalizedText;
    sectionAriaLabel: LocalizedText;
  };
  consent: {
    message: LocalizedText;
    privacyLink: LocalizedText;
    cookieLink: LocalizedText;
    decline: LocalizedText;
    accept: LocalizedText;
    ariaLabel: LocalizedText;
  };
  trust: {
    summary: LocalizedText;
    shippingLink: LocalizedText;
    returnsLink: LocalizedText;
  };
  notifyMe: {
    consent: LocalizedText;
    genericError: LocalizedText;
    validation: LocalizedText;
    emailLabel: LocalizedText;
    submit: LocalizedText;
    submitting: LocalizedText;
    success: LocalizedText;
  };
}

interface SiteContentPayload {
  sourcePaths: string[];
  seoKeywords: string[];
  home: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
    seoHeading: LocalizedText;
    seoBody: LocalizedText;
    faqHeading: LocalizedText;
    faqItems: FaqItem[];
  };
  shop: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    trustBullets: LocalizedText[];
  };
  launchFamilies: Record<"top-handle" | "shoulder" | "mini", { label: LocalizedText; description: LocalizedText }>;
  productPage: {
    proofHeading: LocalizedText;
    proofBullets: LocalizedText[];
    relatedHeading: LocalizedText;
    trustStrip?: TrustStripCopy;
  };
  support: {
    title: LocalizedText;
    summary: LocalizedText;
    channels: LocalizedText[];
    responseSla: LocalizedText;
  };
  policies: Record<"privacy" | "shipping" | "returns" | "terms", PolicyCopy>;
  about: AboutContent;
  chrome?: ChromeContent;
}

const PAYLOAD_RELATIVE_PATH = "data/shops/caryina/site-content.generated.json";
const GENERATED_PAYLOAD_CANDIDATES = [
  path.resolve(process.cwd(), PAYLOAD_RELATIVE_PATH),
  path.resolve(process.cwd(), "apps/caryina", PAYLOAD_RELATIVE_PATH),
  path.resolve(process.cwd(), "..", PAYLOAD_RELATIVE_PATH),
] as const;

let cachedPayload: SiteContentPayload | null = null;

/**
 * @visible-fallback
 * Safe hardcoded payload returned when the generated content file is absent or malformed.
 * This prevents SSR 500 errors during degraded operation.
 * All text is real brand copy — not generator placeholders.
 */
const SAFE_DEFAULTS: SiteContentPayload = {
  sourcePaths: [],
  seoKeywords: [
    "mini bag charm",
    "handbag charm",
    "Italian-designed bag accessory",
    "micro bag charm",
    "structured bag charm with turn lock",
  ],
  home: {
    eyebrow: { en: "Designed in Positano" },
    heading: { en: "Tiny bags, big character." },
    summary: {
      en: "Italian-designed mini bag charms that clip onto your favourite handbag. Structured silhouettes, polished hardware, and a little Positano sunshine in every colorway.",
    },
    ctaPrimary: { en: "Shop the launch" },
    ctaSecondary: { en: "Explore product details" },
    seoHeading: { en: "Mini bag charms designed in Positano, Italy" },
    seoBody: {
      en: "Caryina creates structured mini bag charms with turn-lock closures, textured finishes, and polished hardware. Each charm is designed in Positano and crafted to add personality to any handbag.",
    },
    faqHeading: { en: "Common questions" },
    faqItems: [
      {
        question: { en: "What is this store?" },
        answer: {
          en: "Caryina is a micro-accessories brand designing mini bag charms in Positano, Italy.",
        },
      },
    ],
  },
  shop: {
    eyebrow: { en: "Launch collection" },
    heading: { en: "Shop Caryina" },
    summary: {
      en: "Browse every colorway in the launch collection. Same structured silhouette, same polished hardware — pick the finish that speaks to you.",
    },
    trustBullets: [
      { en: "Designed in Positano, Italy with polished hardware and textured finishes." },
    ],
  },
  launchFamilies: {
    "top-handle": {
      label: { en: "Top Handle" },
      description: { en: "The classic carry. A structured silhouette with a curved top handle and turn-lock closure." },
    },
    shoulder: {
      label: { en: "Shoulder" },
      description: { en: "A compact profile with a shoulder-strap detail, designed to swing from your bag." },
    },
    mini: {
      label: { en: "Mini" },
      description: { en: "The most compact charm in the collection — all the hardware and texture, scaled down to pocket size." },
    },
  },
  productPage: {
    proofHeading: { en: "What makes it special" },
    proofBullets: [
      { en: "Structured silhouette with side gussets — designed to hang from a bag strap, not fold into it." },
      { en: "Turn-lock hardware closure with polished metal hardware." },
      { en: "Designed in Positano, Italy. Manufactured to specification." },
    ],
    relatedHeading: { en: "You may also like" },
    trustStrip: {
      delivery: { en: "Delivery estimate shown at checkout" },
      exchange: { en: "Unused-item exchange requests up to 30 days" },
      origin: { en: "Designed in Positano, Italy" },
      securePayment: { en: "Secure checkout" },
    },
  },
  support: {
    title: { en: "Support" },
    summary: {
      en: "Need a hand? We help with orders, delivery questions, exchange requests, and privacy requests.",
    },
    channels: [
      { en: "Email us and include your order number for faster support." },
    ],
    responseSla: { en: "Usually within 48 hours" },
  },
  policies: {
    privacy: {
      title: { en: "Privacy" },
      summary: { en: "Caryina explains what personal data is used, why it is used, and the rights available to customers." },
      bullets: [
        { en: "Only required checkout and fulfillment data are collected." },
        { en: "Platform providers process payment and delivery data under their legal terms." },
      ],
      notice: { en: "See the full Privacy Policy for complete details." },
    },
    shipping: {
      title: { en: "Shipping" },
      summary: { en: "Dispatch and delivery timing shown at checkout is estimated." },
      bullets: [
        { en: "Delivery timing is estimated and not guaranteed unless Caryina states otherwise." },
      ],
    },
    returns: {
      title: { en: "Returns & Exchanges" },
      summary: { en: "Eligible online orders normally include a 14-day cancellation right." },
      bullets: [
        { en: "14-day statutory cancellation rights apply to eligible online consumer orders." },
        { en: "Unused-item exchange requests may be handled up to 30 days after delivery." },
      ],
    },
    terms: {
      title: { en: "Terms" },
      summary: { en: "By placing an order you agree to our sales terms and support policies." },
      bullets: [
        { en: "Availability and delivery windows may vary depending on stock." },
        { en: "Product photos and descriptions represent the items currently available." },
      ],
    },
  },
  about: {
    title: { en: "About Caryina", de: "Über Caryina", it: "Chi siamo" },
    eyebrow: {
      en: "Designed in Positano, Italy",
      de: "Entworfen in Positano, Italien",
      it: "Progettato a Positano, Italia",
    },
    summary: {
      en: "Caryina designs bag charms in Positano on the Amalfi Coast — small accessories that turn a simple bag into something personal.",
      de: "Caryina entwirft Taschenanhänger in Positano an der Amalfiküste — kleine Accessoires, die eine schlichte Tasche zu etwas Persönlichem machen.",
      it: "Caryina progetta ciondoli per borse a Positano, sulla Costiera Amalfitana — piccoli accessori che trasformano una borsa semplice in qualcosa di personale.",
    },
    paragraphs: [
      {
        en: "Caryina is a collection of bag charms designed in Positano on the Amalfi Coast. Each piece is created to turn a simple bag into something personal — a small detail that's entirely your own.",
        de: "Caryina ist eine Kollektion von Taschenanhängern, die in Positano an der Amalfiküste entworfen wurden. Jedes Stück wurde geschaffen, um eine schlichte Tasche zu etwas Persönlichem zu machen — ein kleines Detail, das ganz dir gehört.",
        it: "Caryina è una collezione di ciondoli per borse progettati a Positano, sulla Costiera Amalfitana. Ogni pezzo è stato creato per trasformare una borsa semplice in qualcosa di personale — un piccolo dettaglio che è interamente tuo.",
      },
      {
        en: "We work with one carefully chosen supplier to bring our designs to life. Every hardware finish, material, and proportion is specified by us. Nothing reaches the collection that we wouldn't carry ourselves.",
        de: "Wir arbeiten mit einem sorgfältig ausgewählten Lieferanten zusammen, um unsere Entwürfe zum Leben zu erwecken. Jede Hardwareoberfläche, jedes Material und jede Proportion wird von uns festgelegt. Nichts gelangt in die Kollektion, was wir nicht selbst tragen würden.",
        it: "Lavoriamo con un unico fornitore scelto con cura per dare vita ai nostri design. Ogni finitura hardware, materiale e proporzione viene specificata da noi. Niente raggiunge la collezione che non porteremmo noi stessi.",
      },
      {
        en: "Caryina is a brand of Skylar SRL, registered in Positano, Italy.",
        de: "Caryina ist eine Marke der Skylar SRL mit Sitz in Positano, Italien.",
        it: "Caryina è un marchio di Skylar SRL, registrata a Positano, Italia.",
      },
    ],
  },
};

function parsePayloadFromPath(payloadPath: string): SiteContentPayload | null {
  let parsed: Partial<SiteContentPayload> | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = fs.readFileSync(payloadPath, "utf8");
    try {
      parsed = JSON.parse(raw) as Partial<SiteContentPayload>;
      break;
    } catch (error) {
      const isUnexpectedEnd =
        error instanceof SyntaxError &&
        error.message.includes("Unexpected end of JSON input");
      if (!isUnexpectedEnd || attempt === 2) {
        return null;
      }
    }
  }

  if (!parsed) return null;
  if (!parsed.home || !parsed.shop || !parsed.productPage || !parsed.support || !parsed.policies || !parsed.about) {
    return null;
  }

  return parsed as SiteContentPayload;
}

function readPayload(): SiteContentPayload {
  if (cachedPayload) return cachedPayload;

  const existingCandidates = GENERATED_PAYLOAD_CANDIDATES.filter((candidate) =>
    fs.existsSync(candidate),
  );
  for (const candidate of existingCandidates) {
    const parsed = parsePayloadFromPath(candidate);
    if (parsed) {
      cachedPayload = parsed;
      return parsed;
    }
  }

  if (existingCandidates.length === 0) {
    console.warn(
      `[contentPacket] Missing generated site-content payload. Checked: ${GENERATED_PAYLOAD_CANDIDATES.join(", ")}. Serving safe defaults. Run startup-loop materializer to restore full content.`,
    );
    cachedPayload = SAFE_DEFAULTS;
    return SAFE_DEFAULTS;
  }
  console.warn(
    `[contentPacket] Invalid generated site-content payload. Checked: ${existingCandidates.join(", ")}. Serving safe defaults.`,
  );
  cachedPayload = SAFE_DEFAULTS;
  return SAFE_DEFAULTS;
}

function localizedText(value: LocalizedText, locale: Locale): string {
  return value[locale] ?? value.en;
}

function localizedList(values: LocalizedText[], locale: Locale): string[] {
  return values.map((value) => localizedText(value, locale));
}

export function getHomeContent(locale: Locale) {
  const payload = readPayload();
  const home = payload.home;

  return {
    eyebrow: localizedText(home.eyebrow, locale),
    heading: localizedText(home.heading, locale),
    summary: localizedText(home.summary, locale),
    ctaPrimary: localizedText(home.ctaPrimary, locale),
    ctaSecondary: localizedText(home.ctaSecondary, locale),
    seoHeading: localizedText(home.seoHeading, locale),
    seoBody: localizedText(home.seoBody, locale),
    faqHeading: localizedText(home.faqHeading, locale),
    faqItems: home.faqItems.map((item) => ({
      question: localizedText(item.question, locale),
      answer: localizedText(item.answer, locale),
    })),
  };
}

export function getShopContent(locale: Locale) {
  const payload = readPayload();
  const shop = payload.shop;

  return {
    eyebrow: localizedText(shop.eyebrow, locale),
    heading: localizedText(shop.heading, locale),
    summary: localizedText(shop.summary, locale),
    trustBullets: localizedList(shop.trustBullets, locale),
  };
}

export function getLaunchFamilyCopy(locale: Locale) {
  const families = readPayload().launchFamilies;
  return {
    "top-handle": {
      label: localizedText(families["top-handle"].label, locale),
      description: localizedText(families["top-handle"].description, locale),
    },
    shoulder: {
      label: localizedText(families.shoulder.label, locale),
      description: localizedText(families.shoulder.description, locale),
    },
    mini: {
      label: localizedText(families.mini.label, locale),
      description: localizedText(families.mini.description, locale),
    },
  };
}

export function getProductPageContent(locale: Locale) {
  const productPage = readPayload().productPage;
  return {
    proofHeading: localizedText(productPage.proofHeading, locale),
    proofBullets: localizedList(productPage.proofBullets, locale),
    relatedHeading: localizedText(productPage.relatedHeading, locale),
  };
}

const TRUST_STRIP_DEFAULTS: TrustStripCopy = {
  delivery: { en: "Delivery estimate shown at checkout" },
  exchange: { en: "Unused-item exchange requests up to 30 days" },
  origin: { en: "Designed in Positano, Italy" },
  securePayment: { en: "Secure checkout" },
};

export function getTrustStripContent(
  locale: Locale,
): { delivery: string; exchange: string; origin: string; securePayment: string } {
  const ts = mergeLocalizedSection(
    TRUST_STRIP_DEFAULTS,
    readPayload().productPage.trustStrip,
  );
  return {
    delivery: localizedText(ts.delivery, locale),
    exchange: localizedText(ts.exchange, locale),
    origin: localizedText(ts.origin, locale),
    securePayment: localizedText(ts.securePayment, locale),
  };
}

export function getSupportContent(locale: Locale) {
  const support = readPayload().support;
  return {
    title: localizedText(support.title, locale),
    summary: localizedText(support.summary, locale),
    channels: localizedList(support.channels, locale),
    responseSla: localizedText(support.responseSla, locale),
  };
}

export function getAboutContent(locale: Locale) {
  const payload = readPayload();
  // Defensive optional chaining: a malformed `about: {}` passes the presence gate in
  // parsePayloadFromPath() but may have undefined fields. Fall back to SAFE_DEFAULTS.about
  // for any missing field so the page never throws at runtime.
  const about = payload.about;
  return {
    title: localizedText(about?.title ?? SAFE_DEFAULTS.about.title, locale),
    eyebrow: localizedText(about?.eyebrow ?? SAFE_DEFAULTS.about.eyebrow, locale),
    summary: localizedText(about?.summary ?? SAFE_DEFAULTS.about.summary, locale),
    paragraphs: localizedList(about?.paragraphs ?? SAFE_DEFAULTS.about.paragraphs, locale),
  };
}

export function getPolicyContent(
  locale: Locale,
  kind: "privacy" | "shipping" | "returns" | "terms",
) {
  const policy = readPayload().policies[kind];
  return {
    title: localizedText(policy.title, locale),
    summary: localizedText(policy.summary, locale),
    bullets: localizedList(policy.bullets, locale),
    notice: policy.notice ? localizedText(policy.notice, locale) : null,
  };
}

/**
 * Authoritative source of truth for all chrome UI micro-copy across all supported locales.
 * Edit here to update chrome translations — do NOT add a `chrome` key to site-content.generated.json.
 */
const CHROME_DEFAULTS: ChromeContent = {
  header: {
    shop: { en: "Shop", de: "Shop", it: "Shop" },
    about: { en: "About", de: "Über uns", it: "Chi siamo" },
    support: { en: "Support", de: "Support", it: "Supporto" },
    navAriaLabel: { en: "Primary", de: "Hauptnavigation", it: "Navigazione principale" },
  },
  footer: {
    about: { en: "About", de: "Über uns", it: "Chi siamo" },
    terms: { en: "Terms", de: "AGB", it: "Termini" },
    privacy: { en: "Privacy", de: "Datenschutz", it: "Privacy" },
    cookie: { en: "Cookies", de: "Cookies", it: "Cookie" },
    returnsRefunds: { en: "Returns & Refunds", de: "Rücksendungen & Erstattungen", it: "Resi e Rimborsi" },
    shipping: { en: "Shipping", de: "Versand", it: "Spedizione" },
    support: { en: "Support", de: "Support", it: "Supporto" },
    copyright: { en: "All rights reserved.", de: "Alle Rechte vorbehalten.", it: "Tutti i diritti riservati." },
    sectionAriaLabel: { en: "Footer", de: "Fußzeile", it: "Piè di pagina" },
  },
  consent: {
    message: {
      en: "We use analytics cookies to understand how visitors interact with our site. See our",
      de: "Wir verwenden Analyse-Cookies, um zu verstehen, wie Besucher unsere Website nutzen. Weitere Informationen finden Sie in unserer",
      it: "Utilizziamo cookie analitici per capire come i visitatori interagiscono con il nostro sito. Consulta la nostra",
    },
    privacyLink: { en: "privacy policy", de: "Datenschutzerklärung", it: "informativa sulla privacy" },
    cookieLink: { en: "cookie policy", de: "Cookie-Richtlinie", it: "cookie policy" },
    decline: { en: "Decline", de: "Ablehnen", it: "Rifiuta" },
    accept: { en: "Accept", de: "Akzeptieren", it: "Accetta" },
    ariaLabel: { en: "Cookie consent", de: "Cookie-Einwilligung", it: "Consenso ai cookie" },
  },
  trust: {
    summary: {
      en: "Delivery estimate shown at checkout · 14-day cancellation right on eligible online orders",
      de: "Lieferzeit wird beim Checkout angezeigt · 14-tägiges Widerrufsrecht für berechtigte Online-Bestellungen",
      it: "Consegna stimata mostrata al checkout · diritto di recesso di 14 giorni per gli ordini online idonei",
    },
    shippingLink: { en: "Shipping policy", de: "Versandrichtlinie", it: "Politica di spedizione" },
    returnsLink: { en: "Returns & exchanges", de: "Rücksendungen & Umtausch", it: "Resi e cambi" },
  },
  notifyMe: {
    consent: {
      en: "I agree to receive a one-time reminder email about this product",
      de: "Ich stimme zu, eine einmalige Erinnerungs-E-Mail zu diesem Produkt zu erhalten",
      it: "Acconsento a ricevere un'unica email di promemoria per questo prodotto",
    },
    genericError: {
      en: "Something went wrong — please try again.",
      de: "Etwas ist schiefgelaufen – bitte versuche es erneut.",
      it: "Qualcosa è andato storto – riprova.",
    },
    validation: {
      en: "Please enter your email and consent to receive the reminder.",
      de: "Bitte gib deine E-Mail-Adresse ein und stimme dem Empfang der Erinnerung zu.",
      it: "Inserisci la tua email e acconsenti a ricevere il promemoria.",
    },
    emailLabel: { en: "Email", de: "E-Mail", it: "Email" },
    submit: { en: "Notify me", de: "Benachrichtige mich", it: "Avvisami" },
    submitting: { en: "Submitting...", de: "Wird gesendet…", it: "Invio in corso…" },
    success: {
      en: "Thank you. We'll email you when this product is available.",
      de: "Danke. Wir senden dir eine E-Mail, wenn dieses Produkt verfügbar ist.",
      it: "Grazie. Ti invieremo un'email quando questo prodotto sarà disponibile.",
    },
  },
};

function mergeLocalizedSection<T extends Record<string, LocalizedText>>(
  defaults: T,
  overrides?: Partial<T>,
): T {
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    merged[key] = overrides?.[key] ?? defaults[key];
  }
  return merged;
}

export function getChromeContent(locale: Locale) {
  const payloadChrome = readPayload().chrome;
  const chrome: ChromeContent = {
    header: mergeLocalizedSection(CHROME_DEFAULTS.header, payloadChrome?.header),
    footer: mergeLocalizedSection(CHROME_DEFAULTS.footer, payloadChrome?.footer),
    consent: mergeLocalizedSection(CHROME_DEFAULTS.consent, payloadChrome?.consent),
    trust: mergeLocalizedSection(CHROME_DEFAULTS.trust, payloadChrome?.trust),
    notifyMe: mergeLocalizedSection(CHROME_DEFAULTS.notifyMe, payloadChrome?.notifyMe),
  };
  return {
    header: {
      shop: localizedText(chrome.header.shop, locale),
      about: localizedText(chrome.header.about, locale),
      support: localizedText(chrome.header.support, locale),
      navAriaLabel: localizedText(chrome.header.navAriaLabel, locale),
    },
    footer: {
      about: localizedText(chrome.footer.about, locale),
      terms: localizedText(chrome.footer.terms, locale),
      privacy: localizedText(chrome.footer.privacy, locale),
      cookie: localizedText(chrome.footer.cookie, locale),
      returnsRefunds: localizedText(chrome.footer.returnsRefunds, locale),
      shipping: localizedText(chrome.footer.shipping, locale),
      support: localizedText(chrome.footer.support, locale),
      copyright: localizedText(chrome.footer.copyright, locale),
      sectionAriaLabel: localizedText(chrome.footer.sectionAriaLabel, locale),
    },
    consent: {
      message: localizedText(chrome.consent.message, locale),
      privacyLink: localizedText(chrome.consent.privacyLink, locale),
      cookieLink: localizedText(chrome.consent.cookieLink, locale),
      decline: localizedText(chrome.consent.decline, locale),
      accept: localizedText(chrome.consent.accept, locale),
      ariaLabel: localizedText(chrome.consent.ariaLabel, locale),
    },
    trust: {
      summary: localizedText(chrome.trust.summary, locale),
      shippingLink: localizedText(chrome.trust.shippingLink, locale),
      returnsLink: localizedText(chrome.trust.returnsLink, locale),
    },
    notifyMe: {
      consent: localizedText(chrome.notifyMe.consent, locale),
      genericError: localizedText(chrome.notifyMe.genericError, locale),
      validation: localizedText(chrome.notifyMe.validation, locale),
      emailLabel: localizedText(chrome.notifyMe.emailLabel, locale),
      submit: localizedText(chrome.notifyMe.submit, locale),
      submitting: localizedText(chrome.notifyMe.submitting, locale),
      success: localizedText(chrome.notifyMe.success, locale),
    },
  };
}

export function getSeoKeywords(): string[] {
  return [...readPayload().seoKeywords];
}

export function getContentSourcePaths(): readonly string[] {
  return [...readPayload().sourcePaths];
}
