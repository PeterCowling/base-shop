"use client";

import React from "react";
import { getBreadcrumbs } from "@acme/platform-core/router/breadcrumbs";

export interface StructuredDataSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: boolean;
  faq?: boolean;
  faqItems?: { question: string; answer: string }[];
  organization?: boolean;
  org?: { name: string; url?: string; logo?: string; sameAs?: string[] };
  localBusiness?: boolean;
  local?: {
    name: string;
    telephone?: string;
    url?: string;
    address?: { streetAddress?: string; addressLocality?: string; postalCode?: string; addressCountry?: string };
    geo?: { latitude: number; longitude: number };
    openingHours?: string[];
  };
}

export default function StructuredDataSection({ breadcrumbs = true, faq, faqItems, organization, org, localBusiness, local }: StructuredDataSectionProps) {
  const blocks: React.ReactNode[] = [];

  try {
    if (breadcrumbs) {
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      const crumbs = getBreadcrumbs(path);
      if (crumbs.length) {
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
        blocks.push(
          <script key="breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        );
      }
    }
  } catch {}

  if (faq && Array.isArray(faqItems) && faqItems.length > 0) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
    };
    blocks.push(
      <script key="faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  }

  if (organization && org?.name) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: org.name,
      url: org.url,
      logo: org.logo,
      sameAs: org.sameAs,
    };
    blocks.push(
      <script key="org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  }

  if (localBusiness && local?.name) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: local.name,
      telephone: local.telephone,
      url: local.url,
      address: local.address ? { "@type": "PostalAddress", ...local.address } : undefined,
      geo: local.geo ? { "@type": "GeoCoordinates", ...local.geo } : undefined,
      openingHours: local.openingHours,
    };
    blocks.push(
      <script key="local" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  }

  if (blocks.length === 0) return null;
  return <>{blocks}</>;
}
