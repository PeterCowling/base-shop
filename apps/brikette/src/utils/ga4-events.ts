// src/utils/ga4-events.ts
// Small GA4 helpers used by Brikette app surfaces.

import roomsData from "@/data/roomsData";

type GTag = (...args: unknown[]) => void;

function getGtag(): GTag | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as Window & { gtag?: GTag }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function calcNights(checkin: string, checkout: string): number {
  return Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000));
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

export function fireRoomBeginCheckout(params: {
  roomSku: string;
  plan: "flex" | "nr";
  checkin: string;
  checkout: string;
}): void {
  const gtag = getGtag();
  if (!gtag) return;

  const nights = calcNights(params.checkin, params.checkout);
  const price = roomsData.find((r) => r.sku === params.roomSku)?.basePrice?.amount ?? 0;

  gtag("event", "begin_checkout", {
    currency: "EUR",
    value: price * nights,
    items: [
      {
        item_id: params.roomSku,
        item_name: params.roomSku,
        item_category: params.plan,
        price,
        quantity: nights,
      },
    ],
  });
}
