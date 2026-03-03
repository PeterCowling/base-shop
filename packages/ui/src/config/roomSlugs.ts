// packages/ui/src/config/roomSlugs.ts
// Per-language URL slugs for individual dorm room detail pages.
// ASCII-safe transliterations of room names in each supported language.
// Non-Latin-script languages (ja, ko, zh, ar, hi, vi) use English slugs.

import type { AppLanguage } from "../i18n.config";

export const ROOM_SLUGS: Readonly<Record<string, Record<AppLanguage, string>>> = {
  room_10: {
    /* Mixed Ensuite Dorm */
    en: "mixed-ensuite-dorm",
    de: "gemischter-schlafsaal-mit-bad",
    es: "dormitorio-mixto-bano-privado",
    fr: "dortoir-mixte-salle-de-bain",
    it: "dormitorio-misto-bagno-privato",
    ja: "mixed-ensuite-dorm",
    ko: "mixed-ensuite-dorm",
    pt: "dormitorio-misto-banheiro-privativo",
    ru: "smeshanniy-dormitoriy-s-sanuzlom",
    zh: "mixed-ensuite-dorm",
    ar: "mixed-ensuite-dorm",
    hi: "mixed-ensuite-dorm",
    vi: "phong-dorm-chung-co-phong-ve-sinh",
    pl: "sypialnia-mieszana-z-lazienka",
    sv: "blandat-sovsal-med-eget-badrum",
    no: "blandet-sovesal-med-eget-bad",
    da: "blandet-sovsal-med-eget-bad",
    hu: "vegyes-kollegium-sajat-furdovel",
  },

  room_11: {
    /* Female Dorm – Large Sea Terrace */
    en: "female-dorm-large-sea-terrace",
    de: "damen-schlafsaal-grosse-meerterrasse",
    es: "dormitorio-femenino-gran-terraza-mar",
    fr: "dortoir-feminin-grande-terrasse-mer",
    it: "dormitorio-femminile-grande-terrazza-mare",
    ja: "female-dorm-large-sea-terrace",
    ko: "female-dorm-large-sea-terrace",
    pt: "dormitorio-feminino-grande-varanda-mar",
    ru: "zhenskiy-dormitoriy-bolshaya-morskaya-terrasa",
    zh: "female-dorm-large-sea-terrace",
    ar: "female-dorm-large-sea-terrace",
    hi: "female-dorm-large-sea-terrace",
    vi: "phong-dorm-nu-ban-cong-bien-lon",
    pl: "sypialnia-damska-duzy-taras-morski",
    sv: "dam-sovsal-stor-havsterrass",
    no: "dame-sovesal-stor-haveterrasse",
    da: "dame-sovsal-stor-havterrasse",
    hu: "noi-kollegium-nagy-tengeri-terasz",
  },

  room_12: {
    /* Mixed Dorm – Sea Terrace */
    en: "mixed-dorm-sea-terrace",
    de: "gemischter-schlafsaal-meerterrasse",
    es: "dormitorio-mixto-terraza-mar",
    fr: "dortoir-mixte-terrasse-mer",
    it: "dormitorio-misto-terrazza-mare",
    ja: "mixed-dorm-sea-terrace",
    ko: "mixed-dorm-sea-terrace",
    pt: "dormitorio-misto-varanda-mar",
    ru: "smeshanniy-dormitoriy-morskaya-terrasa",
    zh: "mixed-dorm-sea-terrace",
    ar: "mixed-dorm-sea-terrace",
    hi: "mixed-dorm-sea-terrace",
    vi: "phong-dorm-chung-ban-cong-bien",
    pl: "sypialnia-mieszana-taras-morski",
    sv: "blandat-sovsal-havsterrass",
    no: "blandet-sovesal-haveterrasse",
    da: "blandet-sovsal-havterrasse",
    hu: "vegyes-kollegium-tengeri-terasz",
  },

  room_3: {
    /* 8-Bed Female Dorm */
    en: "8-bed-female-dorm",
    de: "8-bett-damenschlafsaal",
    es: "dormitorio-femenino-8-camas",
    fr: "dortoir-feminin-8-lits",
    it: "dormitorio-femminile-8-letti",
    ja: "8-bed-female-dorm",
    ko: "8-bed-female-dorm",
    pt: "dormitorio-feminino-8-camas",
    ru: "zhenskiy-dormitoriy-8-mest",
    zh: "8-bed-female-dorm",
    ar: "8-bed-female-dorm",
    hi: "8-bed-female-dorm",
    vi: "phong-dorm-nu-8-giuong",
    pl: "sypialnia-damska-8-lozek",
    sv: "dam-sovsal-8-sanger",
    no: "dame-sovesal-8-senger",
    da: "dame-sovsal-8-senge",
    hu: "noi-kollegium-8-agyas",
  },

  room_4: {
    /* 8-Bed Mixed Dorm */
    en: "8-bed-mixed-dorm",
    de: "8-bett-gemischter-schlafsaal",
    es: "dormitorio-mixto-8-camas",
    fr: "dortoir-mixte-8-lits",
    it: "dormitorio-misto-8-letti",
    ja: "8-bed-mixed-dorm",
    ko: "8-bed-mixed-dorm",
    pt: "dormitorio-misto-8-camas",
    ru: "smeshanniy-dormitoriy-8-mest",
    zh: "8-bed-mixed-dorm",
    ar: "8-bed-mixed-dorm",
    hi: "8-bed-mixed-dorm",
    vi: "phong-dorm-chung-8-giuong",
    pl: "sypialnia-mieszana-8-lozek",
    sv: "blandat-sovsal-8-sanger",
    no: "blandet-sovesal-8-senger",
    da: "blandet-sovsal-8-senge",
    hu: "vegyes-kollegium-8-agyas",
  },

  room_5: {
    /* Female Sea View Dorm */
    en: "female-sea-view-dorm",
    de: "damen-schlafsaal-meerblick",
    es: "dormitorio-femenino-vista-mar",
    fr: "dortoir-feminin-vue-mer",
    it: "dormitorio-femminile-vista-mare",
    ja: "female-sea-view-dorm",
    ko: "female-sea-view-dorm",
    pt: "dormitorio-feminino-vista-mar",
    ru: "zhenskiy-dormitoriy-vid-na-more",
    zh: "female-sea-view-dorm",
    ar: "female-sea-view-dorm",
    hi: "female-sea-view-dorm",
    vi: "phong-dorm-nu-view-bien",
    pl: "sypialnia-damska-widok-morze",
    sv: "dam-sovsal-havsutsikt",
    no: "dame-sovesal-havutsikt",
    da: "dame-sovsal-havudsigt",
    hu: "noi-kollegium-tengeri-kilatas",
  },

  room_6: {
    /* 7-Bed Female Sea View Dorm */
    en: "7-bed-female-sea-view-dorm",
    de: "7-bett-damen-schlafsaal-meerblick",
    es: "dormitorio-femenino-7-camas-vista-mar",
    fr: "dortoir-feminin-7-lits-vue-mer",
    it: "dormitorio-femminile-7-letti-vista-mare",
    ja: "7-bed-female-sea-view-dorm",
    ko: "7-bed-female-sea-view-dorm",
    pt: "dormitorio-feminino-7-camas-vista-mar",
    ru: "zhenskiy-dormitoriy-7-mest-vid-na-more",
    zh: "7-bed-female-sea-view-dorm",
    ar: "7-bed-female-sea-view-dorm",
    hi: "7-bed-female-sea-view-dorm",
    vi: "phong-dorm-nu-7-giuong-view-bien",
    pl: "sypialnia-damska-7-lozek-widok-morze",
    sv: "dam-sovsal-7-sanger-havsutsikt",
    no: "dame-sovesal-7-senger-havutsikt",
    da: "dame-sovsal-7-senge-havudsigt",
    hu: "noi-kollegium-7-agyas-tengeri-kilatas",
  },

  room_9: {
    /* Mixed Room – Single Beds */
    en: "mixed-room-single-beds",
    de: "gemischtes-zimmer-einzelbetten",
    es: "habitacion-mixta-camas-individuales",
    fr: "chambre-mixte-lits-simples",
    it: "camera-mista-letti-singoli",
    ja: "mixed-room-single-beds",
    ko: "mixed-room-single-beds",
    pt: "quarto-misto-camas-individuais",
    ru: "smeshanniy-nomer-otdelnyye-krovati",
    zh: "mixed-room-single-beds",
    ar: "mixed-room-single-beds",
    hi: "mixed-room-single-beds",
    vi: "phong-chung-giuong-don",
    pl: "pokoj-mieszany-lozka-jednoosobowe",
    sv: "blandat-rum-enbangar",
    no: "blandet-rom-enkelsenger",
    da: "blandet-varelse-enkeltsenge",
    hu: "vegyes-szoba-egyszemely-agyak",
  },

  room_8: {
    /* Female Garden Room */
    en: "female-garden-room",
    de: "damen-gartenzimmer",
    es: "habitacion-femenina-jardin",
    fr: "chambre-feminine-jardin",
    it: "camera-femminile-giardino",
    ja: "female-garden-room",
    ko: "female-garden-room",
    pt: "quarto-feminino-jardim",
    ru: "zhenskiy-nomer-s-vidom-na-sad",
    zh: "female-garden-room",
    ar: "female-garden-room",
    hi: "female-garden-room",
    vi: "phong-nu-nhin-vuon",
    pl: "pokoj-damski-ogrod",
    sv: "dam-tradgardsrum",
    no: "dame-hagerom",
    da: "dame-havevarelse",
    hu: "noi-kerti-szoba",
  },
} as const;

/**
 * Returns the URL slug for a room in the given language.
 * Falls back to the room ID if no slug is defined.
 */
export function getRoomSlug(roomId: string, lang: AppLanguage): string {
  return ROOM_SLUGS[roomId]?.[lang] ?? roomId;
}

/**
 * Reverse-looks up a room ID from a URL slug in the given language.
 * Returns undefined if no match is found.
 */
export function findRoomIdBySlug(slug: string, lang: AppLanguage): string | undefined {
  return Object.entries(ROOM_SLUGS).find(([, slugs]) => slugs[lang] === slug)?.[0];
}
