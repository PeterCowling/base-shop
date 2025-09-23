"use client";

import React from "react";
import { getBreadcrumbs } from "@acme/platform-core/router/breadcrumbs";

export interface StructuredDataSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: boolean;
  // Future toggles (FAQ/Organization/LocalBusiness)
  faq?: boolean;
  organization?: boolean;
  localBusiness?: boolean;
}

export default function StructuredDataSection({ breadcrumbs = true }: StructuredDataSectionProps) {
  if (!breadcrumbs) return null;
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    const crumbs = getBreadcrumbs(path);
    if (!crumbs.length) return null;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.label,
        item: typeof window !== "undefined" ? new URL(c.href, window.location.origin).toString() : c.href,
      })),
    };
    return (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  } catch {
    return null;
  }
}

