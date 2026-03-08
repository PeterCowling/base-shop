/* src/slug-map.ts */
import type { SlugMap } from "./types/slugs";

/* --------------------------------------------------------------------------
 * Centralised, ASCII‑safe slugs for static route generation.
 * -------------------------------------------------------------------------- */
export const SLUGS = {
  /* ---------- Guest rooms & dorms ---------- */
  rooms: {
    de: "zimmer",
    en: "dorms",
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

  /** Private rooms (Double Room + Apartment) */
  apartment: {
    de: "privatzimmer", // German
    en: "private-rooms", // English
    es: "habitaciones-privadas", // Spanish
    fr: "chambres-privees", // French
    it: "camere-private", // Italian
    ja: "kojin-heya", // Japanese (個室)
    ko: "gaein-sil", // Korean (개인실)
    pt: "quartos-privados", // Portuguese
    ru: "chastnye-nomera", // Russian (частные номера)
    zh: "siren-kefang", // Chinese (私人客房)
    ar: "ghuraf-khassa",
    hi: "niji-kamre",
    vi: "phong-rieng",
    pl: "pokoje-prywatne",
    sv: "privata-rum",
    no: "private-rom",
    da: "private-vaerelser",
    hu: "privat-szobak",
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
    hi: "aarakshan",
    vi: "dat-phong",
    pl: "rezerwuj",
    sv: "boka",
    no: "bestill",
    da: "bestil",
    hu: "foglalas",
  },

  /** Private accommodations booking landing page */
  privateBooking: {
    de: "privatunterkunft-buchen",
    en: "book-private-accommodations",
    es: "reservar-alojamientos-privados",
    fr: "reserver-hebergements-prives",
    it: "prenota-alloggi-privati",
    ja: "kojin-heya-yoyaku",
    ko: "gaein-sil-yeyak",
    pt: "reservar-acomodacoes-privadas",
    ru: "bronirovat-chastnoe-prozhivanie",
    zh: "yuding-siren-zhusu",
    ar: "hajz-iqama-khassa",
    hi: "niji-aavaas-aarakshan",
    vi: "dat-cho-o-rieng-tu",
    pl: "rezerwuj-prywatny-pobyt",
    sv: "boka-privat-boende",
    no: "bestill-privat-opphold",
    da: "bestil-privat-ophold",
    hu: "privat-szallas-foglalas",
  },

  /** Double private room direct booking page */
  doubleRoomBooking: {
    de: "doppelzimmer-buchen",
    en: "book-double-room",
    es: "reservar-habitacion-doble",
    fr: "reserver-chambre-double",
    it: "prenota-camera-doppia",
    ja: "daburu-rumu-yoyaku",
    ko: "deobeul-rum-yeyak",
    pt: "reservar-quarto-duplo",
    ru: "bron-dvukhmestnogo",
    zh: "yuding-shuangrenfang",
    ar: "hajz-ghurfa-muzdawaja",
    hi: "dabal-kamra-aarakshan",
    vi: "dat-phong-doi",
    pl: "rezerwuj-pokoj-dwuosobowy",
    sv: "boka-dubbelrum",
    no: "bestill-dobbeltrom",
    da: "bestil-dobbeltvaerelse",
    hu: "ketagyas-szoba-foglalas",
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
    it: "etichette",
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
    ja: "riyou-ruuru",
    ko: "iyong-gyuchik",
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
    de: "datenschutz",
    en: "privacy-policy",
    es: "politica-de-privacidad",
    fr: "politique-confidentialite",
    it: "informativa-privacy",
    ja: "kojin-joho-hoshin",
    ko: "gaein-jeongbo-bangchim",
    pt: "politica-de-privacidade",
    ru: "politika-konfidentsialnosti",
    zh: "yinsi-zhengce",
    ar: "siasat-al-khususiya",
    hi: "gopaniyata-niti",
    vi: "chinh-sach-bao-mat",
    pl: "polityka-prywatnosci",
    sv: "integritetspolicy",
    no: "personvern",
    da: "privatlivspolitik",
    hu: "adatvedelmi-tajekoztato",
  },

  /* ---------- Cookie policy ---------- */
  cookiePolicy: {
    de: "cookie-richtlinie",
    en: "cookie-policy",
    es: "politica-de-cookies",
    fr: "politique-cookies",
    it: "politica-cookie",
    ja: "kukki-seisaku",
    ko: "kuki-jeongchaek",
    pt: "politica-de-cookies",
    ru: "politika-cookie",
    zh: "quqi-zhengce",
    ar: "siasat-al-cookie",
    hi: "cookie-niti",
    vi: "chinh-sach-cookie",
    pl: "polityka-cookie",
    sv: "cookiepolicy",
    no: "cookiepolicy",
    da: "cookiepolitik",
    hu: "cookie-szabalyzat",
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
