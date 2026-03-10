import type { AppLanguage } from "../i18n.config";

export const PRIVATE_ROOM_CHILD_ROUTE_IDS = [
  "apartment",
  "double-room",
  "private-stay",
  "street-level-arrival",
] as const;

export type PrivateRoomChildRouteId = (typeof PRIVATE_ROOM_CHILD_ROUTE_IDS)[number];

const PRIVATE_ROOM_CHILD_SLUGS: Readonly<
  Record<PrivateRoomChildRouteId, Record<AppLanguage, string>>
> = {
  apartment: {
    en: "sea-view-apartment",
    es: "apartamento-vista-mar",
    de: "apartment-meerblick",
    fr: "appartement-vue-mer",
    it: "appartamento-vista-mare",
    ja: "umikeshiki-apato",
    ko: "bada-jeonmang-apateu",
    pt: "apartamento-vista-mar",
    ru: "apartamenty-s-vidom-na-more",
    zh: "haijing-gongyu",
    ar: "shaqqa-itlala-bahriya",
    hi: "samudri-drisya-apartment",
    vi: "can-ho-view-bien",
    pl: "apartament-z-widokiem-na-morze",
    sv: "lagenhet-havsutsikt",
    no: "leilighet-havutsikt",
    da: "lejlighed-havudsigt",
    hu: "tengeri-kilatas-apartman",
  },
  "double-room": {
    en: "double-room",
    es: "habitacion-doble",
    de: "doppelzimmer",
    fr: "chambre-double",
    it: "camera-doppia",
    ja: "daburu-rumu",
    ko: "deobeul-rum",
    pt: "quarto-duplo",
    ru: "dvukhmestniy-nomer",
    zh: "shuangren-fang",
    ar: "ghurfa-muzdawaja",
    hi: "dabal-kamra",
    vi: "phong-doi",
    pl: "pokoj-dwuosobowy",
    sv: "dubbelrum",
    no: "dobbeltrom",
    da: "dobbeltvaerelse",
    hu: "ketagyas-szoba",
  },
  "private-stay": {
    en: "private-stay",
    es: "estancia-privada",
    de: "privater-aufenthalt",
    fr: "sejour-prive",
    it: "soggiorno-privato",
    ja: "puraibeto-sutei",
    ko: "peuraibit-seutei",
    pt: "estadia-privada",
    ru: "chastnoe-prozhivanie",
    zh: "siren-zhusu",
    ar: "iqama-khassa",
    hi: "niji-thaharav",
    vi: "luu-tru-rieng-tu",
    pl: "prywatny-pobyt",
    sv: "privat-vistelse",
    no: "privat-opphold",
    da: "privat-ophold",
    hu: "privat-tartozkodas",
  },
  "street-level-arrival": {
    en: "street-level-arrival",
    es: "llegada-sin-escaleras",
    de: "ankunft-ohne-treppen",
    fr: "arrivee-sans-escaliers",
    it: "arrivo-senza-scale",
    ja: "kaidan-nashi-tochaku",
    ko: "gyedan-eopneun-dochak",
    pt: "chegada-sem-escadas",
    ru: "priezd-bez-lestnits",
    zh: "mian-taijie-daoda",
    ar: "wusul-bila-daraj",
    hi: "bina-seedhi-pahunch",
    vi: "den-noi-khong-cau-thang",
    pl: "dojazd-bez-schodow",
    sv: "ankomst-utan-trappor",
    no: "ankomst-uten-trapper",
    da: "ankomst-uden-trapper",
    hu: "erkezes-lepcso-nelkul",
  },
} as const;

const LEGACY_ALIASES_BY_ROUTE_ID: Readonly<
  Partial<Record<PrivateRoomChildRouteId, readonly string[]>>
> = {
  apartment: ["apartment"],
};

export function getPrivateRoomChildSlug(
  routeId: PrivateRoomChildRouteId,
  lang: AppLanguage,
): string {
  return PRIVATE_ROOM_CHILD_SLUGS[routeId][lang];
}

export function getPrivateRoomChildSlugAliases(
  routeId: PrivateRoomChildRouteId,
  lang: AppLanguage,
): readonly string[] {
  const aliases = new Set<string>(LEGACY_ALIASES_BY_ROUTE_ID[routeId] ?? []);
  const englishCanonicalSlug = PRIVATE_ROOM_CHILD_SLUGS[routeId].en;
  const localizedCanonicalSlug = PRIVATE_ROOM_CHILD_SLUGS[routeId][lang];

  if (lang !== "en" && englishCanonicalSlug !== localizedCanonicalSlug) {
    aliases.add(englishCanonicalSlug);
  }

  if (lang === "en" && routeId === "apartment") {
    aliases.add("apartment");
  }

  aliases.delete(localizedCanonicalSlug);
  return [...aliases];
}

export function findPrivateRoomChildRouteIdBySlug(
  slug: string,
  lang: AppLanguage,
): PrivateRoomChildRouteId | undefined {
  const directMatch = PRIVATE_ROOM_CHILD_ROUTE_IDS.find(
    (routeId) => PRIVATE_ROOM_CHILD_SLUGS[routeId][lang] === slug,
  );
  if (directMatch) return directMatch;

  return PRIVATE_ROOM_CHILD_ROUTE_IDS.find((routeId) =>
    getPrivateRoomChildSlugAliases(routeId, lang).includes(slug),
  );
}
