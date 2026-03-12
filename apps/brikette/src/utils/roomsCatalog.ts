// src/utils/roomsCatalog.ts
// -----------------------------------------------------------------------------
// Helper to merge base room definitions with translated copy from roomsPage.json
// -----------------------------------------------------------------------------

import { type RoomId, websiteVisibleRoomsData } from "@/data/roomsData";
import i18n from "@/i18n";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- LINT-1007 [ttl=2026-12-31] JSON import uses build-time resolveJsonModule
// @ts-ignore - resolveJsonModule provides types for the fallback bundle
import EN_APARTMENT_PAGE from "@/locales/en/apartmentPage.json";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- LINT-1007 [ttl=2026-12-31] JSON import uses build-time resolveJsonModule
// @ts-ignore - resolveJsonModule provides types for the fallback bundle
import EN_ROOMS_PAGE from "@/locales/en/roomsPage.json";
import type { LocalizedRoom, RoomCopy } from "@/rooms/types";
import type { RoomAmenity } from "@/types/machine-layer/ml";
import { loadI18nNs } from "@/utils/loadI18nNs";

export type { LocalizedRoom, RoomCopy } from "@/rooms/types";

type RoomsPageNamespace = typeof EN_ROOMS_PAGE;
type RoomsDictionary = RoomsPageNamespace["rooms"];
type FacilitiesDictionary = RoomsPageNamespace["facilities"];
type ApartmentPageNamespace = typeof EN_APARTMENT_PAGE;

// i18n-exempt -- BRIK-2164 [ttl=2026-12-31] Technical English structured-data fallback for missing apartmentPage bundles during tests or preload failure.
const FALLBACK_APARTMENT_TITLE = "Private Apartment";
// i18n-exempt -- BRIK-2164 [ttl=2026-12-31] Technical English structured-data fallback for missing apartmentPage bundles during tests or preload failure.
const FALLBACK_APARTMENT_DESCRIPTION = "Stay in our private apartment in Positano.";

const EN_RESOURCE: RoomsPageNamespace = EN_ROOMS_PAGE ?? { rooms: {}, facilities: {} };
const EN_APARTMENT_RESOURCE: ApartmentPageNamespace = EN_APARTMENT_PAGE ?? {
  title: FALLBACK_APARTMENT_TITLE,
  body: FALLBACK_APARTMENT_DESCRIPTION,
  amenitiesList: [],
  detailsList: [],
};

const normalise = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  return "";
};

const pickFirstString = (values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
};

const pickFirstStringArray = (values: Array<unknown>): string[] | undefined => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const filtered = value.filter(
        (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
      );
      if (filtered.length > 0) return filtered;
    }
  }
  return undefined;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRecordOfStrings = (value: unknown): value is Record<string, string> => {
  if (!isObjectRecord(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
};

const isRoomsPageNamespace = (value: unknown): value is RoomsPageNamespace => {
  if (!isObjectRecord(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    isObjectRecord(record["meta"]) &&
    isRecordOfStrings(record["facilities"]) &&
    isObjectRecord(record["rooms"])
  );
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isApartmentPageNamespace = (value: unknown): value is ApartmentPageNamespace => {
  if (!isObjectRecord(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    (record["title"] === undefined || typeof record["title"] === "string") &&
    (record["body"] === undefined || typeof record["body"] === "string") &&
    (record["amenitiesList"] === undefined || isStringArray(record["amenitiesList"])) &&
    (record["detailsList"] === undefined || isStringArray(record["detailsList"]))
  );
};

interface RoomCopySource {
  title?: string;
  bed_intro?: string;
  bed_description?: string;
  facilities?: string[];
  prices?: {
    nonRefundable?: number;
    flexible?: number;
  };
}

const isRoomCopySource = (value: unknown): value is RoomCopySource => {
  if (!isObjectRecord(value)) return false;
  const record = value as Record<string, unknown>;

  if (record["title"] !== undefined && typeof record["title"] !== "string") return false;
  if (record["bed_intro"] !== undefined && typeof record["bed_intro"] !== "string") return false;
  if (record["bed_description"] !== undefined && typeof record["bed_description"] !== "string") return false;

  if (record["facilities"] !== undefined) {
    if (!Array.isArray(record["facilities"])) return false;
    if (!(record["facilities"] as unknown[]).every((entry) => typeof entry === "string")) return false;
  }

  return true;
};

const getRoomsPageResource = (lang: string): RoomsPageNamespace | undefined => {
  const data = i18n.getDataByLanguage?.(lang);
  if (!data) return undefined;

  if (isRoomsPageNamespace(data)) {
    return data;
  }

  if (isObjectRecord(data)) {
    const namespace = (data as Record<string, unknown>)["roomsPage"];
    if (isRoomsPageNamespace(namespace)) return namespace;
  }

  return undefined;
};

const getApartmentPageResource = (lang: string): ApartmentPageNamespace | undefined => {
  const data = i18n.getDataByLanguage?.(lang);
  if (!data) return undefined;

  if (isApartmentPageNamespace(data)) {
    return data;
  }

  if (isObjectRecord(data)) {
    const namespace = (data as Record<string, unknown>)["apartmentPage"];
    if (isApartmentPageNamespace(namespace)) return namespace;
  }

  return undefined;
};

const resolveFallbackLanguage = (): string => {
  const option = i18n.options?.fallbackLng;
  if (Array.isArray(option) && option.length > 0) return option[0];
  if (typeof option === "string" && option) return option;
  const configFallback = i18nConfig.fallbackLng;
  if (Array.isArray(configFallback) && configFallback.length > 0) return configFallback[0];
  if (typeof configFallback === "string" && configFallback) return configFallback;
  return "en";
};

const buildApartmentCopy = (resources: ApartmentPageNamespace[]): RoomCopy => {
  const title =
    pickFirstString(resources.map((resource) => resource.title)) ||
    EN_APARTMENT_RESOURCE.title ||
    FALLBACK_APARTMENT_TITLE;
  const description =
    pickFirstString(resources.map((resource) => resource.body)) ||
    EN_APARTMENT_RESOURCE.body ||
    title;
  const amenityLabels =
    pickFirstStringArray(resources.map((resource) => resource.amenitiesList)) ||
    pickFirstStringArray(resources.map((resource) => resource.detailsList)) ||
    pickFirstStringArray([EN_APARTMENT_RESOURCE.amenitiesList]) ||
    pickFirstStringArray([EN_APARTMENT_RESOURCE.detailsList]) ||
    [];

  return {
    id: "apartment",
    title: normalise(title) || FALLBACK_APARTMENT_TITLE,
    intro: "",
    description: normalise(description) || normalise(title) || FALLBACK_APARTMENT_TITLE,
    facilityKeys: [],
    amenities: amenityLabels.map((name) => ({ name: normalise(name) || name })),
  };
};

const buildRoomCopy = (
  roomId: RoomId,
  resources: RoomsPageNamespace[],
  apartmentResources: ApartmentPageNamespace[],
): RoomCopy => {
  if (roomId === "apartment") {
    return buildApartmentCopy(apartmentResources);
  }

  const entries = resources.reduce<RoomCopySource[]>((acc, resource) => {
    const candidate = resource?.rooms?.[roomId as keyof RoomsDictionary];
    if (isRoomCopySource(candidate)) acc.push(candidate);
    return acc;
  }, []);

  const fallbackCandidate = EN_RESOURCE.rooms?.[roomId as keyof RoomsDictionary];
  const fallbackEntry = isRoomCopySource(fallbackCandidate) ? fallbackCandidate : undefined;

  const title =
    pickFirstString(entries.map((entry) => entry.title)) ||
    pickFirstString([fallbackEntry?.title]) ||
    roomId;

  const intro =
    pickFirstString(entries.map((entry) => entry.bed_intro)) ||
    pickFirstString([fallbackEntry?.bed_intro]) ||
    "";

  const description =
    pickFirstString(entries.map((entry) => entry.bed_description)) ||
    pickFirstString([fallbackEntry?.bed_description]) ||
    title;

  const facilityKeys =
    pickFirstStringArray(entries.map((entry) => entry.facilities)) ||
    pickFirstStringArray([fallbackEntry?.facilities]) ||
    [];

  const facilities = resources
    .map((resource) => resource?.facilities)
    .filter((dict): dict is FacilitiesDictionary => Boolean(dict));
  if (!facilities.includes(EN_RESOURCE.facilities)) facilities.push(EN_RESOURCE.facilities);

  const amenities: RoomAmenity[] = facilityKeys.map((key) => {
    const label = pickFirstString(facilities.map((dict) => dict?.[key as keyof FacilitiesDictionary]));
    const name = normalise(label) || key;
    return { name };
  });

  return {
    id: roomId,
    title: normalise(title) || roomId,
    intro: normalise(intro),
    description: normalise(description) || normalise(title) || roomId,
    facilityKeys,
    amenities,
  };
};

export const getRoomsCatalog = (
  lang: string,
  options: { fallbackLang?: string } = {}
): LocalizedRoom[] => {
  const fallbackLang = options.fallbackLang ?? resolveFallbackLanguage();
  const resources: RoomsPageNamespace[] = [];
  const apartmentResources: ApartmentPageNamespace[] = [];

  const primary = getRoomsPageResource(lang);
  if (primary) resources.push(primary);
  const primaryApartment = getApartmentPageResource(lang);
  if (primaryApartment) apartmentResources.push(primaryApartment);

  if (fallbackLang && fallbackLang !== lang) {
    const fallbackRes = getRoomsPageResource(fallbackLang);
    if (fallbackRes) resources.push(fallbackRes);
    const fallbackApartmentRes = getApartmentPageResource(fallbackLang);
    if (fallbackApartmentRes) apartmentResources.push(fallbackApartmentRes);
  }

  resources.push(EN_RESOURCE);
  apartmentResources.push(EN_APARTMENT_RESOURCE);

  return websiteVisibleRoomsData.map((room) => {
    const copy = buildRoomCopy(room.id, resources, apartmentResources);
    return {
      ...room,
      title: copy.title,
      intro: copy.intro,
      description: copy.description,
      facilityKeys: copy.facilityKeys,
      amenities: copy.amenities,
    };
  });
};

export const loadRoomsCatalog = async (
  lang: string,
  options: { fallbackLang?: string } = {}
): Promise<LocalizedRoom[]> => {
  const fallbackLang = options.fallbackLang ?? resolveFallbackLanguage();
  // Narrow to AppLanguage where possible; fall back to configured default
  const supported = new Set<string>(i18nConfig.supportedLngs as readonly string[]);
  const typedLang = (supported.has(lang) ? lang : (i18nConfig.fallbackLng as string)) as AppLanguage;
  const typedFallback = (supported.has(fallbackLang)
    ? fallbackLang
    : (i18nConfig.fallbackLng as string)) as AppLanguage;

  try {
    await loadI18nNs(typedLang, "roomsPage");
    await loadI18nNs(typedLang, "apartmentPage");
    if (typedFallback && typedFallback !== typedLang) {
      await loadI18nNs(typedFallback, "roomsPage");
      await loadI18nNs(typedFallback, "apartmentPage");
    }
  } catch {
    // Optional preloading for tests: swallow missing bundle errors here; the
    // catalog builder always includes the embedded EN fallback.
  }
  return getRoomsCatalog(lang, { fallbackLang });
};

export { resolveFallbackLanguage };
