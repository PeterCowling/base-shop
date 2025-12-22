// src/article-slug-map.ts
// ---------------------------------------------------------------------------
// One ASCII-safe slug per <HelpArticleKey, language> pair.
//
// • Keys match `ARTICLE_KEYS` in routes.assistance-helpers.ts
// • Every supported language should appear, but the helper can still
//   fall back to English when a translation is missing.
//
// Edit freely: this module is the single source of truth.
// ---------------------------------------------------------------------------

import type { AppLanguage } from "./i18n.config";
import type { HelpArticleKey } from "./routes.assistance-helpers";

type Lang = AppLanguage;

/** Strongly-typed 2-level dictionary: articleKey → language → slug */
export type ArticleSlugMap = {
  readonly [K in HelpArticleKey]: Readonly<Partial<Record<Lang, string>>> & {
    readonly en: string; // English slug must always exist
  };
};

/* --------------------------------------------------------------------------
 * Slug catalogue
 * -------------------------------------------------------------------------- */
export const ARTICLE_SLUGS: ArticleSlugMap = {
  /* 1 ▪ Age & accessibility */
  ageAccessibility: {
    en: "age-accessibility",
    de: "age-accessibility",
    es: "edad-accesibilidad",
    fr: "age-accessibilite",
    it: "eta-accessibilita",
    ja: "age-accessibility",
    ko: "age-accessibility",
    pt: "idade-acessibilidade",
    ru: "age-accessibility",
    zh: "age-accessibility",
    ar: "age-accessibility",
    hi: "age-accessibility",
    vi: "age-accessibility",
    pl: "age-accessibility",
    sv: "age-accessibility",
    no: "age-accessibility",
    da: "age-accessibility",
    hu: "age-accessibility",
  },

  /* 2 ▪ Booking basics */
  bookingBasics: {
    en: "booking-basics",
    de: "booking-basics",
    es: "conceptos-basicos-reserva",
    fr: "notions-base-reservation",
    it: "nozioni-base-prenotazione",
    ja: "booking-basics",
    ko: "booking-basics",
    pt: "conceitos-basicos-reserva",
    ru: "booking-basics",
    zh: "booking-basics",
    ar: "booking-basics",
    hi: "booking-basics",
    vi: "booking-basics",
    pl: "booking-basics",
    sv: "booking-basics",
    no: "booking-basics",
    da: "booking-basics",
    hu: "booking-basics",
  },

  /* 3 ▪ Changing or cancelling */
  changingCancelling: {
    en: "changing-cancelling",
    de: "changing-cancelling",
    es: "cambiar-cancelar",
    fr: "modifier-annuler",
    it: "modificare-annullare",
    ja: "changing-cancelling",
    ko: "changing-cancelling",
    pt: "alterar-cancelar",
    ru: "changing-cancelling",
    zh: "changing-cancelling",
    ar: "changing-cancelling",
    hi: "changing-cancelling",
    vi: "changing-cancelling",
    pl: "changing-cancelling",
    sv: "changing-cancelling",
    no: "changing-cancelling",
    da: "changing-cancelling",
    hu: "changing-cancelling",
  },

  /* 4 ▪ Check-in / check-out */
  checkinCheckout: {
    en: "checkin-checkout",
    de: "checkin-checkout",
    es: "entrada-salida",
    fr: "arrivee-depart",
    it: "arrivo-partenza",
    ja: "checkin-checkout",
    ko: "checkin-checkout",
    pt: "entrada-saida",
    ru: "checkin-checkout",
    zh: "checkin-checkout",
    ar: "checkin-checkout",
    hi: "checkin-checkout",
    vi: "checkin-checkout",
    pl: "checkin-checkout",
    sv: "checkin-checkout",
    no: "checkin-checkout",
    da: "checkin-checkout",
    hu: "checkin-checkout",
  },

  /* 5 ▪ Defects & damages */
  defectsDamages: {
    en: "defects-damages",
    de: "defects-damages",
    es: "defectos-danos",
    fr: "defauts-degats",
    it: "difetti-danni",
    ja: "defects-damages",
    ko: "defects-damages",
    pt: "defeitos-danos",
    ru: "defects-damages",
    zh: "defects-damages",
    ar: "defects-damages",
    hi: "defects-damages",
    vi: "defects-damages",
    pl: "defects-damages",
    sv: "defects-damages",
    no: "defects-damages",
    da: "defects-damages",
    hu: "defects-damages",
  },

  /* 6 ▪ Deposits & payments */
  depositsPayments: {
    en: "deposits-payments",
    de: "deposits-payments",
    es: "depositos-pagos",
    fr: "depots-paiements",
    it: "depositi-pagamenti",
    ja: "deposits-payments",
    ko: "deposits-payments",
    pt: "depositos-pagamentos",
    ru: "deposits-payments",
    zh: "deposits-payments",
    ar: "deposits-payments",
    hi: "deposits-payments",
    vi: "deposits-payments",
    pl: "deposits-payments",
    sv: "deposits-payments",
    no: "deposits-payments",
    da: "deposits-payments",
    hu: "deposits-payments",
  },

  /* 7 ▪ House rules */
  rules: {
    en: "rules",
    de: "rules",
    es: "reglas",
    fr: "regles",
    it: "regole",
    ja: "rules",
    ko: "rules",
    pt: "regras",
    ru: "rules",
    zh: "rules",
    ar: "rules",
    hi: "rules",
    vi: "rules",
    pl: "rules",
    sv: "rules",
    no: "rules",
    da: "rules",
    hu: "rules",
  },

  /* 8 ▪ Security */
  security: {
    en: "security",
    de: "security",
    es: "seguridad",
    fr: "securite",
    it: "sicurezza",
    ja: "security",
    ko: "security",
    pt: "seguranca",
    ru: "security",
    zh: "security",
    ar: "security",
    hi: "security",
    vi: "security",
    pl: "security",
    sv: "security",
    no: "security",
    da: "security",
    hu: "security",
  },

  /* 9 ▪ Legal stuff */
  legal: {
    en: "legal",
    de: "legal",
    es: "legal",
    fr: "juridique",
    it: "legale",
    ja: "legal",
    ko: "legal",
    pt: "juridico",
    ru: "legal",
    zh: "legal",
    ar: "legal",
    hi: "legal",
    vi: "legal",
    pl: "legal",
    sv: "legal",
    no: "legal",
    da: "legal",
    hu: "legal",
  },

  /* 10 ▪ Arriving by ferry */
  arrivingByFerry: {
    en: "arriving-by-ferry",
    de: "arriving-by-ferry",
    es: "llegar-en-ferry",
    fr: "arriver-en-ferry",
    it: "arrivo-in-traghetto",
    ja: "arriving-by-ferry",
    ko: "arriving-by-ferry",
    pt: "chegar-de-ferry",
    ru: "arriving-by-ferry",
    zh: "arriving-by-ferry",
    ar: "arriving-by-ferry",
    hi: "arriving-by-ferry",
    vi: "arriving-by-ferry",
    pl: "arriving-by-ferry",
    sv: "arriving-by-ferry",
    no: "arriving-by-ferry",
    da: "arriving-by-ferry",
    hu: "arriving-by-ferry",
  },

  naplesAirportBus: {
    en: "naples-airport-to-positano-bus",
    de: "naples-airport-to-positano-bus",
    es: "autobus-aeropuerto-napoles-positano",
    fr: "bus-aeroport-naples-positano",
    it: "bus-aeroporto-napoli-positano",
    ja: "naples-airport-to-positano-bus",
    ko: "naples-airport-to-positano-bus",
    pt: "onibus-aeroporto-napoles-positano",
    ru: "naples-airport-to-positano-bus",
    zh: "naples-airport-to-positano-bus",
    ar: "naples-airport-to-positano-bus",
    hi: "naples-airport-to-positano-bus",
    vi: "naples-airport-to-positano-bus",
    pl: "naples-airport-to-positano-bus",
    sv: "naples-airport-to-positano-bus",
    no: "naples-airport-to-positano-bus",
    da: "naples-airport-to-positano-bus",
    hu: "naples-airport-to-positano-bus",
  },

  /* 11 ▪ Travel help */
  travelHelp: {
    en: "travel-help",
    de: "travel-help",
    es: "ayuda-viaje",
    fr: "aide-voyage",
    it: "aiuto-viaggio",
    ja: "travel-help",
    ko: "travel-help",
    pt: "ajuda-viagem",
    ru: "travel-help",
    zh: "travel-help",
    ar: "travel-help",
    hi: "travel-help",
    vi: "travel-help",
    pl: "travel-help",
    sv: "travel-help",
    no: "travel-help",
    da: "travel-help",
    hu: "travel-help",
  },
} as const;
