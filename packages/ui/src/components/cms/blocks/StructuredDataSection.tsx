"use client";
/* eslint-disable ds/no-hardcoded-copy -- ABC-123: JSON-LD schema includes non-UI string literals (context/type identifiers) */

import React from "react";

// i18n-exempt -- JSON-LD schema URL constant -- ABC-123
const SCHEMA_CONTEXT = "https://schema.org"; // i18n-exempt -- ABC-123
// i18n-exempt -- JSON-LD type constants -- ABC-123
const TYPE_BREADCRUMB_LIST = "BreadcrumbList"; // i18n-exempt -- ABC-123
const TYPE_LIST_ITEM = "ListItem"; // i18n-exempt -- ABC-123
const TYPE_FAQ_PAGE = "FAQPage"; // i18n-exempt -- ABC-123
const TYPE_QUESTION = "Question"; // i18n-exempt -- ABC-123
const TYPE_ANSWER = "Answer"; // i18n-exempt -- ABC-123
const TYPE_ORGANIZATION = "Organization"; // i18n-exempt -- ABC-123
const TYPE_LOCAL_BUSINESS = "LocalBusiness"; // i18n-exempt -- ABC-123
const TYPE_POSTAL_ADDRESS = "PostalAddress"; // i18n-exempt -- ABC-123
const TYPE_GEOCOORDINATES = "GeoCoordinates"; // i18n-exempt -- ABC-123
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
        // i18n-exempt -- JSON-LD schema constants and crumb labels are not UI copy
        const jsonLd = {
          // i18n-exempt -- schema context URL is not user copy -- ABC-123
          "@context": SCHEMA_CONTEXT,
          // i18n-exempt -- schema type identifier -- ABC-123
          "@type": TYPE_BREADCRUMB_LIST,
          itemListElement: crumbs.map((c, i) => ({
            "@type": TYPE_LIST_ITEM,
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
    // i18n-exempt -- JSON-LD schema constants; content comes from CMS
    const jsonLd = {
      // i18n-exempt -- schema context URL is not user copy -- ABC-123
      "@context": SCHEMA_CONTEXT,
      // i18n-exempt -- schema type identifier -- ABC-123
      "@type": TYPE_FAQ_PAGE,
      mainEntity: faqItems.map((q) => ({
        "@type": TYPE_QUESTION,
        name: q.question,
        acceptedAnswer: { "@type": TYPE_ANSWER, text: q.answer },
      })),
    };
    blocks.push(
      <script key="faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  }

  if (organization && org?.name) {
    // i18n-exempt -- JSON-LD schema constants; org data is not UI copy -- ABC-123
    const jsonLd = {
      // i18n-exempt -- schema context URL is not user copy -- ABC-123
      "@context": SCHEMA_CONTEXT,
      // i18n-exempt -- schema type identifier -- ABC-123
      "@type": TYPE_ORGANIZATION,
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
    // i18n-exempt -- JSON-LD schema constants; local business data is not UI copy -- ABC-123
    const jsonLd = {
      // i18n-exempt -- schema context URL is not user copy -- ABC-123
      "@context": SCHEMA_CONTEXT,
      // i18n-exempt -- schema type identifier -- ABC-123
      "@type": TYPE_LOCAL_BUSINESS,
      name: local.name,
      telephone: local.telephone,
      url: local.url,
      address: local.address ? { "@type": TYPE_POSTAL_ADDRESS, ...local.address } : undefined,
      geo: local.geo ? { "@type": TYPE_GEOCOORDINATES, ...local.geo } : undefined,
      openingHours: local.openingHours,
    };
    blocks.push(
      <script key="local" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
  }

  if (blocks.length === 0) return null;
  return <>{blocks}</>;
}
