import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { generateLangParams } from "@/app/_lib/static-params";
import type { AppLanguage } from "@/i18n.config";
import { INTERNAL_SEGMENT_BY_KEY } from "@/routing/sectionSegments";
import { getSlug } from "@/utils/slug";

import AboutPage, { generateMetadata as generateAboutMetadata } from "../about/page";
import AssistancePage, { generateMetadata as generateAssistanceMetadata } from "../assistance/page";
import BarMenuPage, { generateMetadata as generateBarMenuMetadata } from "../bar-menu/page";
import BookPage, { generateMetadata as generateBookMetadata } from "../book/page";
import BookPrivateAccomodationsPage, { generateMetadata as generatePrivateBookingMetadata } from "../book-private-accommodations/page";
import BreakfastMenuPage, { generateMetadata as generateBreakfastMenuMetadata } from "../breakfast-menu/page";
import CareersPage, { generateMetadata as generateCareersMetadata } from "../careers/page";
import CookiePolicyPage, { generateMetadata as generateCookiePolicyMetadata } from "../cookie-policy/page";
import DealsPage, { generateMetadata as generateDealsMetadata } from "../deals/page";
import RoomsPage, { generateMetadata as generateRoomsMetadata } from "../dorms/page";
import ExperiencesPage, { generateMetadata as generateExperiencesMetadata } from "../experiences/page";
import HouseRulesPage, { generateMetadata as generateHouseRulesMetadata } from "../house-rules/page";
import HowToGetHerePage, { generateMetadata as generateHowToGetHereMetadata } from "../how-to-get-here/page";
import PrivacyPolicyPage, { generateMetadata as generatePrivacyPolicyMetadata } from "../privacy-policy/page";
import PrivateRoomsPage, { generateMetadata as generatePrivateRoomsMetadata } from "../private-rooms/page";
import TermsPage, { generateMetadata as generateTermsMetadata } from "../terms/page";

const LOCALIZED_SECTION_KEYS = [
  "about",
  "rooms",
  "deals",
  "careers",
  "breakfastMenu",
  "barMenu",
  "terms",
  "houseRules",
  "privacyPolicy",
  "cookiePolicy",
  "assistance",
  "experiences",
  "howToGetHere",
  "privateBooking",
  "book",
  "apartment",
] as const;

type AliasSectionKey = (typeof LOCALIZED_SECTION_KEYS)[number];

type CanonicalRouteProps = {
  params: Promise<{ lang: string }>;
};

type CanonicalRouteModule = {
  page: (props: CanonicalRouteProps) => Promise<JSX.Element>;
  metadata: (props: CanonicalRouteProps) => Promise<Metadata>;
};

const CANONICAL_ROUTE_BY_KEY: Record<AliasSectionKey, CanonicalRouteModule> = {
  about: { page: AboutPage, metadata: generateAboutMetadata },
  rooms: { page: RoomsPage, metadata: generateRoomsMetadata },
  deals: { page: DealsPage, metadata: generateDealsMetadata },
  careers: { page: CareersPage, metadata: generateCareersMetadata },
  breakfastMenu: { page: BreakfastMenuPage, metadata: generateBreakfastMenuMetadata },
  barMenu: { page: BarMenuPage, metadata: generateBarMenuMetadata },
  terms: { page: TermsPage, metadata: generateTermsMetadata },
  houseRules: { page: HouseRulesPage, metadata: generateHouseRulesMetadata },
  privacyPolicy: { page: PrivacyPolicyPage, metadata: generatePrivacyPolicyMetadata },
  cookiePolicy: { page: CookiePolicyPage, metadata: generateCookiePolicyMetadata },
  assistance: { page: AssistancePage, metadata: generateAssistanceMetadata },
  experiences: { page: ExperiencesPage, metadata: generateExperiencesMetadata },
  howToGetHere: { page: HowToGetHerePage, metadata: generateHowToGetHereMetadata },
  privateBooking: { page: BookPrivateAccomodationsPage, metadata: generatePrivateBookingMetadata },
  book: { page: BookPage, metadata: generateBookMetadata },
  apartment: { page: PrivateRoomsPage, metadata: generatePrivateRoomsMetadata },
};

function normaliseSegment(segment: string): string {
  if (!segment) return "";
  try {
    return decodeURIComponent(segment).trim().toLowerCase();
  } catch {
    return segment.trim().toLowerCase();
  }
}

function resolveAliasKey(lang: AppLanguage, localizedSection: string): AliasSectionKey | null {
  const normalized = normaliseSegment(localizedSection);
  if (!normalized) return null;

  for (const key of LOCALIZED_SECTION_KEYS) {
    const localized = getSlug(key, lang).toLowerCase();
    const internal = INTERNAL_SEGMENT_BY_KEY[key].toLowerCase();
    if (localized !== internal && localized === normalized) {
      return key;
    }
  }

  return null;
}

export async function generateStaticParams(): Promise<Array<{ lang: string; localizedSection: string }>> {
  return generateLangParams().flatMap(({ lang }) => {
    const appLang = toAppLanguage(lang);

    return LOCALIZED_SECTION_KEYS.flatMap((key) => {
      // Explicit route folders own English canonicals; skip duplicate alias generation here.
      if ((key === "book" || key === "privateBooking") && appLang === "en") return [];

      const localizedSection = getSlug(key, appLang);
      const internalSection = INTERNAL_SEGMENT_BY_KEY[key];
      if (localizedSection === internalSection) return [];

      return [{ lang, localizedSection }];
    });
  });
}

type Props = {
  params: Promise<{ lang: string; localizedSection: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, localizedSection } = await params;
  const appLang = toAppLanguage(lang);
  const key = resolveAliasKey(appLang, localizedSection);
  if (!key) return {};

  const routeModule = CANONICAL_ROUTE_BY_KEY[key];
  return routeModule.metadata({ params: Promise.resolve({ lang: appLang }) });
}

export default async function LocalizedSectionAliasPage({ params }: Props): Promise<JSX.Element> {
  const { lang, localizedSection } = await params;
  const appLang = toAppLanguage(lang);
  const key = resolveAliasKey(appLang, localizedSection);
  if (!key) {
    notFound();
  }

  const routeModule = CANONICAL_ROUTE_BY_KEY[key];
  return routeModule.page({ params: Promise.resolve({ lang: appLang }) });
}
