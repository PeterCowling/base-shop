"use client";

// Thin client CTA link for PrivateRoomsSummaryContent.
// Writes entry attribution to session storage before navigating so the booking
// page can emit a complete handoff_to_engine event with product_type context.

import type { ReactNode } from "react";
import Link from "next/link";

import { writeAttribution } from "@/utils/entryAttribution";

type Props = {
  href: string;
  lang: string;
  productType: "apartment" | "double_private_room";
  className?: string;
  children: ReactNode;
};

export function PrivateSummaryCtaLink({ href, lang, productType, className, children }: Props) {
  function handleClick() {
    writeAttribution({
      source_surface: "private_summary",
      source_cta: "private_summary_cta",
      resolved_intent: "private",
      product_type: productType,
      decision_mode: "direct_resolution",
      destination_funnel: "private",
      locale: lang,
      fallback_triggered: false,
    });
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
