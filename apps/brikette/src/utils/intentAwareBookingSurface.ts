import type { AppLanguage } from "@/i18n.config";

import type { EntryAttributionPayload } from "./entryAttribution";
import {
  getBookPath,
  getDoubleRoomBookingPath,
  getPrivateBookingPath,
} from "./localizedRoutes";
import { getPrivateRoomsPath } from "./privateRoomPaths";

type BookingProductType = "apartment" | "double_private_room" | "hostel_bed" | null;

type SurfaceOption = {
  href: string;
  resolvedIntent: "hostel" | "private";
  productType: BookingProductType;
  decisionMode: "direct_resolution" | "chooser";
  destinationFunnel: "hostel_central" | "private";
};

export type IntentAwareBookingSurface =
  | {
      mode: "direct";
      primary: SurfaceOption;
    }
  | {
      mode: "chooser";
      hostel: SurfaceOption;
      private: SurfaceOption;
    };

function appendDealParam(href: string, dealId?: string | null): string {
  if (!dealId) {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}deal=${encodeURIComponent(dealId)}`;
}

function resolvePrivateHref(
  lang: AppLanguage,
  attribution: EntryAttributionPayload | null,
): SurfaceOption {
  if (attribution?.product_type === "apartment") {
    return {
      href: getPrivateBookingPath(lang),
      resolvedIntent: "private",
      productType: "apartment",
      decisionMode: "direct_resolution",
      destinationFunnel: "private",
    };
  }

  if (attribution?.product_type === "double_private_room") {
    return {
      href: getDoubleRoomBookingPath(lang),
      resolvedIntent: "private",
      productType: "double_private_room",
      decisionMode: "direct_resolution",
      destinationFunnel: "private",
    };
  }

  return {
    href: getPrivateRoomsPath(lang),
    resolvedIntent: "private",
    productType: null,
    decisionMode: "direct_resolution",
    destinationFunnel: "private",
  };
}

export function resolveIntentAwareBookingSurface(
  lang: AppLanguage,
  attribution: EntryAttributionPayload | null,
  options?: { dealId?: string | null },
): IntentAwareBookingSurface {
  const hostelOption: SurfaceOption = {
    href: appendDealParam(getBookPath(lang), options?.dealId),
    resolvedIntent: "hostel",
    productType: null,
    decisionMode: "direct_resolution",
    destinationFunnel: "hostel_central",
  };

  if (attribution?.resolved_intent === "hostel") {
    return {
      mode: "direct",
      primary: hostelOption,
    };
  }

  if (attribution?.resolved_intent === "private") {
    return {
      mode: "direct",
      primary: resolvePrivateHref(lang, attribution),
    };
  }

  return {
    mode: "chooser",
    hostel: {
      ...hostelOption,
      decisionMode: "chooser",
    },
    private: {
      ...resolvePrivateHref(lang, attribution),
      decisionMode: "chooser",
    },
  };
}
