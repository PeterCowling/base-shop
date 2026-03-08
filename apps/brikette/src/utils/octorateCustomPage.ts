import { OCTORATE_CUSTOM_PAGE_ENABLED } from "@/config/env";
import roomsData, { type Room, type RoomId } from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { buildOctorateUrl, type BuildOctorateUrlParams, type BuildOctorateUrlResult } from "@/utils/buildOctorateUrl";

export type HostelRatePlan = "nr" | "flex";

type SearchParamValue = string | string[] | undefined;

export type SecureBookingQuery = {
  checkin: string;
  checkout: string;
  pax: number;
  plan: HostelRatePlan;
  room: Room;
  deal?: string;
};

export type BuildHostelBookingTargetParams = BuildOctorateUrlParams & {
  lang: AppLanguage;
};

export type BuildHostelBookingTargetResult =
  | {
      ok: true;
      directUrl: string;
      mode: "custom_page" | "direct";
      url: string;
    }
  | Extract<BuildOctorateUrlResult, { ok: false }>;

function readSearchParam(
  search:
    | URLSearchParams
    | Record<string, SearchParamValue>,
  key: string
): string | undefined {
  if (search instanceof URLSearchParams) {
    const value = search.get(key);
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  const value = search[key];
  if (Array.isArray(value)) {
    const first = value.find((candidate) => typeof candidate === "string" && candidate.length > 0);
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isRoomId(value: string): value is RoomId {
  return roomsData.some((room) => room.id === value);
}

export function getSecureBookingInternalPath(lang: AppLanguage): string {
  return `/${lang}/book/secure-booking`;
}

export function buildSecureBookingRouteUrl({
  lang,
  checkin,
  checkout,
  pax,
  plan,
  roomSku,
  deal,
}: {
  lang: AppLanguage;
  checkin: string;
  checkout: string;
  pax: number;
  plan: HostelRatePlan;
  roomSku: string;
  deal?: string;
}): string {
  const params = new URLSearchParams({
    checkin,
    checkout,
    pax: String(pax),
    plan,
    room: roomSku,
  });

  if (deal && deal.trim()) {
    params.set("deal", deal.trim());
  }

  return `${getSecureBookingInternalPath(lang)}?${params.toString()}`;
}

export function buildHostelBookingTarget(
  params: BuildHostelBookingTargetParams
): BuildHostelBookingTargetResult {
  const directResult = buildOctorateUrl(params);
  if (!directResult.ok) return directResult;

  const mode = OCTORATE_CUSTOM_PAGE_ENABLED ? "custom_page" : "direct";
  return {
    ok: true,
    directUrl: directResult.url,
    mode,
    url:
      mode === "custom_page"
        ? buildSecureBookingRouteUrl({
            lang: params.lang,
            checkin: params.checkin,
            checkout: params.checkout,
            pax: params.pax,
            plan: params.plan,
            roomSku: params.roomSku,
            ...(params.deal ? { deal: params.deal } : {}),
          })
        : directResult.url,
  };
}

export function parseSecureBookingSearchParams(
  search:
    | URLSearchParams
    | Record<string, SearchParamValue>
): SecureBookingQuery | null {
  const roomValue = readSearchParam(search, "room");
  const planValue = readSearchParam(search, "plan");
  const paxValue = readSearchParam(search, "pax");
  const checkin = readSearchParam(search, "checkin");
  const checkout = readSearchParam(search, "checkout");

  if (!roomValue || !isRoomId(roomValue) || !checkin || !checkout || !paxValue) {
    return null;
  }
  if (planValue !== "nr" && planValue !== "flex") {
    return null;
  }

  const pax = Number.parseInt(paxValue, 10);
  if (!Number.isInteger(pax)) {
    return null;
  }

  const room = roomsData.find((candidate) => candidate.id === roomValue);
  if (!room) return null;

  const deal = readSearchParam(search, "deal");

  return {
    checkin,
    checkout,
    pax,
    plan: planValue,
    room,
    ...(deal ? { deal } : {}),
  };
}

export function buildSecureBookingDirectUrl(
  query: SecureBookingQuery,
  bookingCode: string
): BuildOctorateUrlResult {
  return buildOctorateUrl({
    bookingCode,
    checkin: query.checkin,
    checkout: query.checkout,
    deal: query.deal,
    octorateRateCode: query.room.rateCodes.direct[query.plan],
    pax: query.pax,
    plan: query.plan,
    roomSku: query.room.sku,
  });
}
