// src/utils/ga4-events.ts
// Small GA4 helpers used by Brikette app surfaces.

type GTag = (...args: unknown[]) => void;

// Canonical analytics enums (authoritative). Keep these stable and low-cardinality.
export const GA4_ENUMS = {
  itemListId: ["home_rooms_carousel", "rooms_index", "book_rooms", "deals_index", "room_detail"] as const,
  modalType: ["offers", "location", "contact", "facilities", "language"] as const,
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
    "offers_modal_reserve",
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
    "offers_modal",
  ] as const,
  source: ["header", "mobile_nav", "hero", "booking_widget", "room_card", "sticky_cta", "deals", "unknown"] as const,
  ratePlan: ["flex", "nr"] as const,
} as const;

export type ItemListId = (typeof GA4_ENUMS.itemListId)[number];
export type ModalTypeParam = (typeof GA4_ENUMS.modalType)[number];
export type CtaId = (typeof GA4_ENUMS.ctaId)[number];
export type CtaLocation = (typeof GA4_ENUMS.ctaLocation)[number];
export type EventSource = (typeof GA4_ENUMS.source)[number];
export type RatePlan = (typeof GA4_ENUMS.ratePlan)[number];

// ─── GA4 e-commerce data models ─────────────────────────────────────────────

export interface GA4Promotion {
  promotion_id: string; // deal ID
  promotion_name: string; // deal title
}

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category: "hostel";
  affiliation: "Hostel Brikette";
  currency: "EUR";
  item_variant?: "nr" | "flex";
  item_list_id?: string;
  item_list_name?: string;
  price?: number;
  quantity?: number;
  index?: number;
}

const ITEM_LIST_NAME: Record<ItemListId, string> = {
  home_rooms_carousel: "Home rooms carousel",
  rooms_index: "Rooms index",
  book_rooms: "Book page rooms",
  deals_index: "Deals index",
  room_detail: "Room detail",
};

export function resolveItemListName(id: ItemListId): string {
  return ITEM_LIST_NAME[id];
}

export function isEventSource(value: string): value is EventSource {
  return (GA4_ENUMS.source as readonly string[]).includes(value);
}

export function isModalTypeParam(value: string): value is ModalTypeParam {
  return (GA4_ENUMS.modalType as readonly string[]).includes(value);
}

export function isCtaId(value: string): value is CtaId {
  return (GA4_ENUMS.ctaId as readonly string[]).includes(value);
}

export function isCtaLocation(value: string): value is CtaLocation {
  return (GA4_ENUMS.ctaLocation as readonly string[]).includes(value);
}

export function isItemListId(value: string): value is ItemListId {
  return (GA4_ENUMS.itemListId as readonly string[]).includes(value);
}

export function buildRoomItem(params: {
  roomSku: string;
  itemName?: string;
  plan?: RatePlan;
  index?: number;
}): GA4Item {
  return {
    item_id: params.roomSku,
    item_name: params.itemName ?? params.roomSku,
    item_category: "hostel",
    affiliation: "Hostel Brikette",
    currency: "EUR",
    ...(params.plan ? { item_variant: params.plan } : undefined),
    ...(typeof params.index === "number" ? { index: params.index } : undefined),
  } as GA4Item;
}

const impressionDedupe = new Set<string>();
let impressionPathname: string | null = null;

function getCurrentPathname(): string | null {
  if (typeof window === "undefined") return null;
  return typeof window.location?.pathname === "string" ? window.location.pathname : null;
}

export function resetImpressionDedupe(): void {
  impressionDedupe.clear();
  impressionPathname = getCurrentPathname();
}

export function shouldFireImpressionOnce(key: string): boolean {
  const pathname = getCurrentPathname();
  if (pathname && impressionPathname && pathname !== impressionPathname) {
    // Dedupe is per-navigation (route) not per-session.
    impressionDedupe.clear();
  }
  if (pathname) {
    impressionPathname = pathname;
  }
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

export function fireModalOpen(params: { modalType: string; source?: string }): void {
  const gtag = getGtag();
  if (!gtag) return;

  const modalType = typeof params.modalType === "string" && isModalTypeParam(params.modalType) ? params.modalType : null;
  if (!modalType) return;

  const source = typeof params.source === "string" && isEventSource(params.source) ? params.source : "unknown";
  gtag("event", "modal_open", { modal_type: modalType, source });
}

export function fireModalClose(params: { modalType: string; source?: string }): void {
  const gtag = getGtag();
  if (!gtag) return;

  const modalType = typeof params.modalType === "string" && isModalTypeParam(params.modalType) ? params.modalType : null;
  if (!modalType) return;

  const source = typeof params.source === "string" && isEventSource(params.source) ? params.source : "unknown";
  gtag("event", "modal_close", { modal_type: modalType, source });
}

export function fireCtaClick(params: { ctaId: string; ctaLocation: string }): void {
  const gtag = getGtag();
  if (!gtag) return;

  const ctaId = typeof params.ctaId === "string" && isCtaId(params.ctaId) ? params.ctaId : null;
  const ctaLocation =
    typeof params.ctaLocation === "string" && isCtaLocation(params.ctaLocation) ? params.ctaLocation : null;

  if (!ctaId || !ctaLocation) return;

  gtag("event", "cta_click", {
    cta_id: ctaId,
    cta_location: ctaLocation,
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
  coupon?: string;
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
      ...(params.coupon ? { coupon: params.coupon } : null),
      items: [buildRoomItem({ roomSku: params.roomSku, plan: params.plan })],
    },
    onNavigate: params.onNavigate,
  });
}

export function fireSelectItem(params: {
  itemListId: ItemListId;
  roomSku: string;
  itemName?: string;
  plan: RatePlan;
  index?: number;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "select_item", {
    item_list_id: params.itemListId,
    item_list_name: resolveItemListName(params.itemListId),
    items: [buildRoomItem({ roomSku: params.roomSku, itemName: params.itemName, plan: params.plan, index: params.index })],
  });
}

export function fireViewItemList(params: {
  itemListId: ItemListId;
  rooms: Array<{ sku: string; name?: string }>;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  // Dedupe guard: fire once per navigation per item_list_id
  if (!shouldFireImpressionOnce(`view_item_list:${params.itemListId}`)) return;

  gtag("event", "view_item_list", {
    item_list_id: params.itemListId,
    item_list_name: resolveItemListName(params.itemListId),
    items: params.rooms.map((room, index) => buildRoomItem({ roomSku: room.sku, itemName: room.name, index })),
  });
}

// ─── Promotion events (TASK-31) ───────────────────────────────────────────────

/**
 * Fire `view_promotion` when a list of promotions/deals becomes visible to the user.
 * Corresponds to GA4 standard e-commerce event.
 *
 * TC-01: gtag called with "view_promotion" + { promotions: GA4Promotion[] }
 */
export function fireViewPromotion(params: { promotions: GA4Promotion[] }): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "view_promotion", {
    promotions: params.promotions,
  });
}

/**
 * Fire `select_promotion` when the user clicks/selects a single promotion/deal.
 * Corresponds to GA4 standard e-commerce event.
 *
 * TC-02: gtag called with "select_promotion" + { promotions: [GA4Promotion] }
 */
export function fireSelectPromotion(params: { promotion: GA4Promotion }): void {
  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "select_promotion", {
    promotions: [params.promotion],
  });
}

export function fireViewItem(params: { itemId: string; itemName?: string }): void {
  const gtag = getGtag();
  if (!gtag) return;

  // Dedupe guard: fire once per navigation per item_id
  if (!shouldFireImpressionOnce(`view_item:${params.itemId}`)) return;

  gtag("event", "view_item", {
    items: [
      {
        item_id: params.itemId,
        item_name: params.itemName ?? params.itemId,
      },
    ],
  });
}

// ─── handoff_to_engine instrumentation (TASK-05A) ───────────────────────────
// Canonical event emitted at every Octorate handoff click point.
// Required params: handoff_mode, engine_endpoint, checkin, checkout, pax.

export type HandoffMode = "new_tab" | "same_tab";
export type EngineEndpoint = "calendar" | "result" | "confirm";

export interface HandoffToEngineParams {
  handoff_mode: HandoffMode;
  engine_endpoint: EngineEndpoint;
  checkin: string;
  checkout: string;
  pax: number;
  source?: string;
}

// Per-click dedupe: prevents double-fire within 300ms (TC-02).
let _lastHandoffTs = 0;

export function resetHandoffDedupe(): void {
  _lastHandoffTs = 0;
}

/**
 * Fire `handoff_to_engine` synchronously with beacon transport.
 * Use for new_tab handoffs (page stays active) or when the caller owns navigation.
 */
export function fireHandoffToEngine(params: HandoffToEngineParams): void {
  const now = Date.now();
  if (now - _lastHandoffTs < 300) return;
  _lastHandoffTs = now;

  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", "handoff_to_engine", {
    handoff_mode: params.handoff_mode,
    engine_endpoint: params.engine_endpoint,
    checkin: params.checkin,
    checkout: params.checkout,
    pax: params.pax,
    transport_type: "beacon",
    ...(params.source ? { source: params.source } : null),
  });
}

/**
 * Fire `handoff_to_engine` with outbound reliability (beacon + timeout fallback).
 * Use for same_tab handoffs where this function must also drive page navigation.
 */
export function fireHandoffToEngineAndNavigate(
  params: HandoffToEngineParams & { onNavigate: () => void; timeoutMs?: number },
): void {
  const now = Date.now();
  if (now - _lastHandoffTs < 300) {
    params.onNavigate();
    return;
  }
  _lastHandoffTs = now;

  fireEventWithOutboundReliability({
    event: "handoff_to_engine",
    payload: {
      handoff_mode: params.handoff_mode,
      engine_endpoint: params.engine_endpoint,
      checkin: params.checkin,
      checkout: params.checkout,
      pax: params.pax,
      ...(params.source ? { source: params.source } : null),
    },
    onNavigate: params.onNavigate,
    timeoutMs: params.timeoutMs,
  });
}

// ─── whatsapp_click instrumentation (TASK-09) ───────────────────────────────
// Fired when a user clicks the WhatsApp CTA from the apartment booking surface.

export function fireWhatsappClick(params: { placement: string; prefill_present: boolean }): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "whatsapp_click", {
    placement: params.placement,
    prefill_present: params.prefill_present,
  });
}

/**
 * Non-navigating begin_checkout compat fire for migration window (see TASK-05B).
 * Fires the event synchronously without beacon or navigation callback.
 * To be cleaned up once handoff_to_engine parity is confirmed.
 */
export function fireBeginCheckoutRoomSelected(params: {
  source: string;
  roomSku: string;
  plan: RatePlan;
  checkin: string;
  checkout: string;
  pax: number;
  item_list_id?: string;
  coupon?: string;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  const source = typeof params.source === "string" && isEventSource(params.source) ? params.source : "unknown";
  const itemListId =
    typeof params.item_list_id === "string" && isItemListId(params.item_list_id) ? params.item_list_id : undefined;

  gtag("event", "begin_checkout", {
    source,
    checkin: params.checkin,
    checkout: params.checkout,
    pax: params.pax,
    ...(itemListId ? { item_list_id: itemListId } : null),
    ...(params.coupon ? { coupon: params.coupon } : null),
    items: [buildRoomItem({ roomSku: params.roomSku, plan: params.plan })],
  });
}
