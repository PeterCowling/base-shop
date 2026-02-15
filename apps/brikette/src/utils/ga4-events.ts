// src/utils/ga4-events.ts
// Small GA4 helpers used by Brikette app surfaces.

type GTag = (...args: unknown[]) => void;

// Canonical analytics enums (authoritative). Keep these stable and low-cardinality.
export const GA4_ENUMS = {
  itemListId: ["home_rooms_carousel", "rooms_index", "book_rooms", "deals_index"] as const,
  ctaId: [
    "header_check_availability",
    "mobile_nav_check_availability",
    "hero_check_availability",
    "booking_widget_check_availability",
    "room_card_reserve_nr",
    "room_card_reserve_flex",
    "sticky_book_now",
    "deals_book_direct",
    "content_sticky_check_availability",
  ] as const,
  ctaLocation: [
    "desktop_header",
    "mobile_nav",
    "home_hero",
    "home_booking_widget",
    "rooms_list",
    "book_page",
    "room_detail",
    "deals_page",
    "guide_detail",
    "about_page",
    "bar_menu",
    "breakfast_menu",
    "assistance",
    "how_to_get_here",
  ] as const,
  source: ["header", "mobile_nav", "hero", "booking_widget", "room_card", "sticky_cta", "deals", "unknown"] as const,
  ratePlan: ["flex", "nr"] as const,
} as const;

export type ItemListId = (typeof GA4_ENUMS.itemListId)[number];
export type CtaId = (typeof GA4_ENUMS.ctaId)[number];
export type CtaLocation = (typeof GA4_ENUMS.ctaLocation)[number];
export type EventSource = (typeof GA4_ENUMS.source)[number];
export type RatePlan = (typeof GA4_ENUMS.ratePlan)[number];

export function isEventSource(value: string): value is EventSource {
  return (GA4_ENUMS.source as readonly string[]).includes(value);
}

export function isItemListId(value: string): value is ItemListId {
  return (GA4_ENUMS.itemListId as readonly string[]).includes(value);
}

export function buildRoomItem(params: { roomSku: string; plan?: RatePlan; index?: number }): Record<string, unknown> {
  return {
    item_id: params.roomSku,
    item_name: params.roomSku,
    ...(params.plan ? { item_variant: params.plan } : null),
    ...(typeof params.index === "number" ? { index: params.index } : null),
  };
}

const impressionDedupe = new Set<string>();

export function shouldFireImpressionOnce(key: string): boolean {
  if (impressionDedupe.has(key)) return false;
  impressionDedupe.add(key);
  return true;
}

function getGtag(): GTag | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as Window & { gtag?: GTag }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function fireEventWithOutboundReliability(params: {
  event: string;
  payload: Record<string, unknown>;
  onNavigate: () => void;
  timeoutMs?: number;
}): void {
  const gtag = getGtag();
  const timeoutMs = params.timeoutMs ?? 150;

  if (!gtag) {
    params.onNavigate();
    return;
  }

  let didNavigate = false;
  const navigateOnce = (): void => {
    if (didNavigate) return;
    didNavigate = true;
    params.onNavigate();
  };

  const timer = window.setTimeout(navigateOnce, timeoutMs);
  gtag("event", params.event, {
    ...params.payload,
    transport_type: "beacon",
    event_callback: () => {
      window.clearTimeout(timer);
      navigateOnce();
    },
  });
}

export function fireEventAndNavigate(params: {
  event: string;
  payload: Record<string, unknown>;
  onNavigate: () => void;
  timeoutMs?: number;
}): void {
  fireEventWithOutboundReliability(params);
}

function calcNights(checkin: string, checkout: string): number {
  return Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000));
}

function calcLeadTimeDays(checkin: string): number {
  const today = new Date();
  const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const startOfCheckin = new Date(`${checkin}T00:00:00Z`);
  const days = Math.floor((startOfCheckin.getTime() - startOfToday.getTime()) / 86_400_000);
  return Math.max(0, days);
}

export function fireSearchAvailability(params: {
  source: EventSource;
  checkin: string;
  checkout: string;
  pax: number;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "search_availability", {
    source: params.source,
    pax: params.pax,
    nights: calcNights(params.checkin, params.checkout),
    lead_time_days: calcLeadTimeDays(params.checkin),
  });
}

export function fireSearchAvailabilityAndNavigate(params: {
  source: string;
  checkin: string;
  checkout: string;
  pax: number;
  onNavigate: () => void;
}): void {
  const source = typeof params.source === "string" && isEventSource(params.source) ? params.source : "unknown";
  fireEventAndNavigate({
    event: "search_availability",
    payload: {
      source,
      pax: params.pax,
      nights: calcNights(params.checkin, params.checkout),
      lead_time_days: calcLeadTimeDays(params.checkin),
    },
    onNavigate: params.onNavigate,
  });
}

export function fireBeginCheckoutGeneric(params: {
  source: "booking_modal" | "booking2_modal";
  checkin: string;
  checkout: string;
  pax: number;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "begin_checkout", {
    source: params.source,
    checkin: params.checkin,
    checkout: params.checkout,
    pax: params.pax,
  });
}

export function fireBeginCheckoutGenericAndNavigate(params: {
  source: "booking_modal" | "booking2_modal";
  checkin: string;
  checkout: string;
  pax: number;
  onNavigate: () => void;
}): void {
  fireEventWithOutboundReliability({
    event: "begin_checkout",
    payload: {
      source: params.source,
      checkin: params.checkin,
      checkout: params.checkout,
      pax: params.pax,
    },
    onNavigate: params.onNavigate,
  });
}

export function fireRoomBeginCheckout(params: {
  roomSku: string;
  plan: RatePlan;
  checkin: string;
  checkout: string;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "begin_checkout", {
    items: [buildRoomItem({ roomSku: params.roomSku, plan: params.plan })],
  });
}

export function fireBeginCheckoutRoomSelectedAndNavigate(params: {
  source: string;
  roomSku: string;
  plan: RatePlan;
  checkin: string;
  checkout: string;
  pax: number;
  item_list_id?: string;
  onNavigate: () => void;
}): void {
  const source = typeof params.source === "string" && isEventSource(params.source) ? params.source : "unknown";
  const itemListId =
    typeof params.item_list_id === "string" && isItemListId(params.item_list_id) ? params.item_list_id : undefined;

  fireEventAndNavigate({
    event: "begin_checkout",
    payload: {
      source,
      checkin: params.checkin,
      checkout: params.checkout,
      pax: params.pax,
      ...(itemListId ? { item_list_id: itemListId } : null),
      items: [buildRoomItem({ roomSku: params.roomSku, plan: params.plan })],
    },
    onNavigate: params.onNavigate,
  });
}
