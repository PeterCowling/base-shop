import type { Metadata } from "next";

import { buildMetadata } from "@acme/seo/metadata";

import type { Locale } from "./locales";
import { DEFAULT_LOCALE, LOCALES } from "./locales";

const SITE_URL =
  process.env["NEXT_PUBLIC_BASE_URL"] || "https://skylarsrl.com";

// i18n-exempt -- SEO-08 site identity constant [ttl=2027-12-31]
const SITE_NAME = "Skylar SRL";

const siteConfig = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: [...LOCALES],
};

export function skylarMetadata({
  locale,
  title,
  description,
  path,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}): Metadata {
  return buildMetadata(siteConfig, {
    title,
    description,
    path: `/${locale}${path}`,
    locale,
  });
}
