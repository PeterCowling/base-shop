/* src/slug-map.ts */
import type { SlugMap } from "./types/slugs";

/* --------------------------------------------------------------------------
 * Centralised, ASCII‑safe slugs for static route generation.
 * -------------------------------------------------------------------------- */
export const SLUGS = {
  /* ---------- Guest rooms & dorms ---------- */
  rooms: {
    de: "zimmer",
    en: "rooms",
    es: "habitaciones",
    fr: "chambres",
    it: "camere",
    ja: "heya",
    ko: "bang",
    pt: "quartos",
    ru: "komnaty",
    zh: "fangjian",
    ar: "ghuraf",
    hi: "kamare",
    vi: "phong",
    pl: "pokoje",
    sv: "rum",
    no: "rom",
    da: "vaerelser",
    hu: "szobak",
  },

  /* ---------- Offers & promotions ---------- */
  deals: {
    de: "angebote",
    en: "deals",
    es: "ofertas",
    fr: "offres",
    it: "offerte",
    ja: "otoku",
    ko: "teukga",
    pt: "ofertas",
    ru: "skidki",
    zh: "tejia",
    ar: "urood",
    hi: "prastav",
    vi: "uu-dai",
    pl: "promocje",
    sv: "erbjudanden",
    no: "tilbud",
    da: "tilbud",
    hu: "akciok",
  },

  /* ---------- Work with us ---------- */
  careers: {
    de: "karriere",
    en: "careers",
    es: "empleos",
    fr: "carrieres", // intentional ASCII fallback
    it: "carriere",
    ja: "kyaria",
    ko: "chaeyong",
    pt: "carreiras",
    ru: "karera",
    zh: "zhaopin",
    ar: "wazayif",
    hi: "naukri",
    vi: "tuyen-dung",
    pl: "praca",
    sv: "karriar",
    no: "karriere",
    da: "karriere",
    hu: "karrier",
  },

  /** About the hostel */
  about: {
    de: "ueber-uns", // German (über uns)
    en: "about", // English
    es: "sobre-nosotros", // Spanish
    fr: "a-propos", // French
    it: "chi-siamo", // Italian
    ja: "annai", // Japanese (案内)
    ko: "sogae", // Korean (소개)
    pt: "sobre-nos", // Portuguese
    ru: "o-nas", // Russian (о нас)
    zh: "guanyu", // Chinese (关于)
    ar: "man-nahnu",
    hi: "hamare-bare-mein",
    vi: "ve-chung-toi",
    pl: "o-nas",
    sv: "om-oss",
    no: "om-oss",
    da: "om-os",
    hu: "rolunk",
  },

  /* ---------- Help centre / FAQ ---------- */
  assistance: {
    // Locale-specific help centre slugs (ASCII transliterations only).
    de: "hilfe",
    en: "help",
    es: "ayuda",
    fr: "aide",
    it: "assistenza",
    ja: "sapoto",
    ko: "jiwon",
    pt: "ajuda",
    ru: "pomoshch",
    zh: "bangzhu",
    ar: "musaada",
    hi: "sahayata",
    vi: "tro-giup",
    pl: "pomoc",
    sv: "hjalp",
    no: "hjelp",
    da: "hjaelp",
    hu: "segitseg",
  },

  /* ---------- Experiences ---------- */
  experiences: {
    de: "erlebnisse",
    en: "experiences",
    es: "experiencias",
    fr: "experiences",
    it: "esperienze",
    ja: "taiken",
    ko: "cheheom",
    pt: "experiencias",
    ru: "vpechatleniya",
    zh: "tiyan",
    ar: "tajarib",
    hi: "anubhav",
    vi: "trai-nghiem",
    pl: "doswiadczenia",
    sv: "upplevelser",
    no: "opplevelser",
    da: "oplevelser",
    hu: "elmenyek",
  },

  /* ---------- How to Get Here ---------- */
  howToGetHere: {
    de: "anfahrt",
    en: "how-to-get-here",
    es: "como-llegar",
    fr: "comment-venir",
    it: "come-arrivare",
    ja: "akusesu",
    ko: "osineun-gil",
    pt: "como-chegar",
    ru: "kak-dobratsya",
    zh: "ruhe-daoda",
    ar: "kayfa-tasil",
    hi: "kaise-pahunchen",
    vi: "cach-den-day",
    pl: "jak-dojechac",
    sv: "hitta-hit",
    no: "finn-veien",
    da: "find-vej",
    hu: "hogyan-jutsz-ide",
  },

  /** Apartment details */
  apartment: {
    de: "wohnungen", // German
    en: "apartment", // English
    es: "apartamentos", // Spanish
    fr: "appartements", // French
    it: "appartamenti", // Italian
    ja: "apaato", // Japanese (アパート)
    ko: "apateu", // Korean (아파트)
    pt: "apartamentos", // Portuguese
    ru: "kvartiry", // Russian (квартиры)
    zh: "gongyu", // Chinese (公寓)
    ar: "shuqaq",
    hi: "awas",
    vi: "can-ho",
    pl: "apartamenty",
    sv: "lagenheter",
    no: "leiligheter",
    da: "lejligheder",
    hu: "apartmanok",
  },

  /** Booking landing page */
  book: {
    de: "buchen",
    en: "book",
    es: "reservar",
    fr: "reserver",
    it: "prenota",
    ja: "yoyaku",
    ko: "yeyak",
    pt: "reservar",
    ru: "bronirovanie",
    zh: "yuding",
    ar: "hajz",
    hi: "book",
    vi: "dat-phong",
    pl: "rezerwuj",
    sv: "boka",
    no: "bestill",
    da: "book",
    hu: "foglalas",
  },

  /* (blog removed) */

  /* ---------- Travel guides ---------- */
  guides: {
    de: "reisefuehrer",
    en: "guides",
    es: "guias",
    fr: "guides",
    it: "guide",
    ja: "gaido",
    ko: "gaideu",
    pt: "guias",
    ru: "gidy",
    zh: "zhinan",
    ar: "dalail",
    hi: "margdarshika",
    vi: "huong-dan",
    pl: "przewodniki",
    sv: "guider",
    no: "guider",
    da: "guider",
    hu: "utmutatok",
  },

  /* ---------- Guides tag index ---------- */
  guidesTags: {
    de: "schlagwoerter",
    en: "tags",
    es: "etiquetas",
    fr: "etiquettes",
    it: "tags",
    ja: "tagu",
    ko: "tegeu",
    pt: "etiquetas",
    ru: "tegi",
    zh: "biaoqian",
    ar: "wusum",
    hi: "soochak",
    vi: "the",
    pl: "tagi",
    sv: "taggar",
    no: "tagger",
    da: "maerker",
    hu: "cimkek",
  },

  /* ---------- Terms & Conditions ---------- */
  terms: {
    de: "bedingungen",
    en: "terms",
    es: "terminos-condiciones",
    fr: "conditions-generales",
    it: "termini-condizioni",
    ja: "riyokiyaku",
    ko: "yagwan",
    pt: "termos-condicoes",
    ru: "pravila-usloviya",
    zh: "tiaokuan",
    ar: "shorout",
    hi: "niyam-sharten",
    vi: "dieu-khoan",
    pl: "regulamin",
    sv: "villkor",
    no: "vilkar",
    da: "vilkar",
    hu: "feltetelek",
  },

  /* ---------- House Rules ---------- */
  houseRules: {
    de: "hausordnung",
    en: "house-rules",
    es: "normas-de-la-casa",
    fr: "reglement-interieur",
    it: "regole-della-casa",
    ja: "house-rules",
    ko: "house-rules",
    pt: "regras-da-casa",
    ru: "pravila-prozhivaniya",
    zh: "jiagui",
    ar: "qawaid-albayt",
    hi: "ghar-ke-niyam",
    vi: "noi-quy-nha",
    pl: "zasady-domu",
    sv: "husregler",
    no: "husregler",
    da: "husregler",
    hu: "hazi-szabalyok",
  },

  /* ---------- Privacy policy ---------- */
  privacyPolicy: {
    de: "privacy-policy",
    en: "privacy-policy",
    es: "privacy-policy",
    fr: "privacy-policy",
    it: "privacy-policy",
    ja: "privacy-policy",
    ko: "privacy-policy",
    pt: "privacy-policy",
    ru: "privacy-policy",
    zh: "privacy-policy",
    ar: "privacy-policy",
    hi: "privacy-policy",
    vi: "privacy-policy",
    pl: "privacy-policy",
    sv: "privacy-policy",
    no: "privacy-policy",
    da: "privacy-policy",
    hu: "privacy-policy",
  },

  /* ---------- Cookie policy ---------- */
  cookiePolicy: {
    de: "cookie-policy",
    en: "cookie-policy",
    es: "cookie-policy",
    fr: "cookie-policy",
    it: "cookie-policy",
    ja: "cookie-policy",
    ko: "cookie-policy",
    pt: "cookie-policy",
    ru: "cookie-policy",
    zh: "cookie-policy",
    ar: "cookie-policy",
    hi: "cookie-policy",
    vi: "cookie-policy",
    pl: "cookie-policy",
    sv: "cookie-policy",
    no: "cookie-policy",
    da: "cookie-policy",
    hu: "cookie-policy",
  },

  /* ---------- Breakfast menu (public) ---------- */
  breakfastMenu: {
    de: "fruehstuecksmenue",
    en: "breakfast-menu",
    es: "menu-desayuno",
    fr: "menu-petit-dejeuner",
    it: "menu-colazione",
    ja: "choshoku-menu",
    ko: "achim-menu",
    pt: "menu-cafe-da-manha",
    ru: "menyu-zavtrak",
    zh: "zaocan-caidan",
    ar: "qaimat-futur",
    hi: "nashta-menu",
    vi: "thuc-don-bua-sang",
    pl: "menu-sniadaniowe",
    sv: "frukostmeny",
    no: "frokostmeny",
    da: "morgenmadsmenu",
    hu: "reggeli-etlap",
  },

  /* ---------- Bar menu (public) ---------- */
  barMenu: {
    de: "bar-speisekarte",
    en: "bar-menu",
    es: "carta-bebidas",
    fr: "carte-boissons",
    it: "menu-bevande",
    ja: "ba-menyu",
    ko: "jujeom-menyu",
    pt: "cardapio-bar",
    ru: "menu-bara",
    zh: "jiuba-caidan",
    ar: "qaimat-bar",
    hi: "peene-ka-menu",
    vi: "thuc-don-quay-bar",
    pl: "menu-barowe",
    sv: "barmeny",
    no: "barmeny",
    da: "barmenu",
    hu: "bar-etlap",
  },
} as const satisfies SlugMap;

/* Keys as a strongly‑typed constant array (useful for maps & refactors) */
export const SLUG_KEYS = Object.keys(SLUGS) as (keyof typeof SLUGS)[];

export type { SlugMap } from "./types/slugs";
