// apps/brikette/src/utils/intentResolver.ts
// Single-authority intent resolver for the Brikette cohesive sales funnel.
// Pure function, SSR-safe (no side effects, no session storage calls, no window access).
// The resolver does NOT return a URL; URL construction is the caller's responsibility.

export interface IntentResolution {
  resolved_intent: "hostel" | "private" | "undetermined";
  product_type: "hostel_bed" | "apartment" | "double_private_room" | null;
  decision_mode: "direct_resolution" | "chooser" | "hybrid_merchandising";
  destination_funnel: "hostel_central" | "hostel_assist" | "private";
}

// ─── Routing rules ────────────────────────────────────────────────────────────
//
// ctaLocation → IntentResolution mapping per plan TASK-09 spec:
//
// Hostel-central CTAs (sitewide shell surfaces):
//   desktop_header, mobile_nav, notification_banner, offers_modal, booking_widget
//   → hostel / null / direct_resolution / hostel_central
//
// sticky_cta:
//   → depends on pageContext.isPrivateRoute
//   → true  → private / null / direct_resolution / private
//   → false → hostel / null / direct_resolution / hostel_central
//
// Room-level hostel CTAs:
//   room_card, sticky_book_now
//   → hostel / hostel_bed / direct_resolution / hostel_assist
//
// Deals page CTA:
//   deals_page_cta
//   → hostel / null / direct_resolution / hostel_central
//
// Unknown ctaLocation (safe fallback):
//   → undetermined / null / chooser / hostel_central

const HOSTEL_CENTRAL: IntentResolution = {
  resolved_intent: "hostel",
  product_type: null,
  decision_mode: "direct_resolution",
  destination_funnel: "hostel_central",
};

const HOSTEL_ASSIST: IntentResolution = {
  resolved_intent: "hostel",
  product_type: "hostel_bed",
  decision_mode: "direct_resolution",
  destination_funnel: "hostel_assist",
};

const PRIVATE_DIRECT: IntentResolution = {
  resolved_intent: "private",
  product_type: null,
  decision_mode: "direct_resolution",
  destination_funnel: "private",
};

const UNDETERMINED_FALLBACK: IntentResolution = {
  resolved_intent: "undetermined",
  product_type: null,
  decision_mode: "chooser",
  destination_funnel: "hostel_central",
};

/** ctaLocation values that always resolve to hostel_central */
const HOSTEL_CENTRAL_LOCATIONS = new Set([
  "desktop_header",
  "mobile_nav",
  "notification_banner",
  "offers_modal",
  "booking_widget",
  "home_booking_widget",
  "home_hero",
  "deals_page_cta",
]);

/** ctaLocation values that resolve to hostel_assist (room-level) */
const HOSTEL_ASSIST_LOCATIONS = new Set([
  "room_card",
  "sticky_book_now",
]);

export function resolveIntent(
  ctaLocation: string,
  pageContext?: { isPrivateRoute?: boolean; productType?: string },
): IntentResolution {
  if (HOSTEL_CENTRAL_LOCATIONS.has(ctaLocation)) {
    return HOSTEL_CENTRAL;
  }

  if (HOSTEL_ASSIST_LOCATIONS.has(ctaLocation)) {
    return HOSTEL_ASSIST;
  }

  if (ctaLocation === "sticky_cta") {
    if (pageContext?.isPrivateRoute === true) {
      return PRIVATE_DIRECT;
    }
    return HOSTEL_CENTRAL;
  }

  // Unknown ctaLocation → safe fallback; decision_mode: 'chooser' is classification only,
  // no chooser UI component is created by this plan.
  return UNDETERMINED_FALLBACK;
}
