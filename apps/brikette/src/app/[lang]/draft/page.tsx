// src/app/[lang]/draft/page.tsx
// Draft guides dashboard - App Router version
import type { Metadata } from "next";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import type { AppLanguage } from "@/i18n.config";
import {
  buildGuideChecklist,
  type GuideManifestEntry,
  listGuideManifestEntries,
  resolveDraftPathSegment,
} from "@/routes/guides/guide-manifest";
import type { ManifestOverrides } from "@/routes/guides/guide-manifest-overrides";
import { loadGuideManifestOverridesFromFs } from "@/routes/guides/guide-manifest-overrides.node";
import type { GuideSeoTemplateProps } from "@/routes/guides/guide-seo/types";

import DraftDashboardContent, { type DraftGuideSummary } from "./DraftDashboardContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  const path = `/${validLang}/draft`;

  return buildAppMetadata({
    lang: validLang,
    title: "Guides draft dashboard",
    description: "Track publication status and outstanding tasks for every guide.",
    path,
    ogType: "website",
    isPublished: false, // Prevent indexing of internal draft dashboard
  });
}

function buildSummary(
  entry: GuideManifestEntry,
  lang: AppLanguage,
  overrides: ManifestOverrides,
): DraftGuideSummary {
  const overridePath = overrides[entry.key]?.draftPathSegment;
  return {
    key: entry.key,
    slug: entry.slug,
    status: entry.status,
    areas: entry.areas,
    primaryArea: entry.primaryArea,
    checklist: buildGuideChecklist(entry, { includeDiagnostics: true, lang }),
    draftPath: resolveDraftPathSegment(entry, overridePath),
  };
}

export default async function DraftPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  // Load manifest overrides server-side
  const overrides = loadGuideManifestOverridesFromFs();

  // Fetch guide data on the server to ensure consistent SSR/hydration
  const guides = listGuideManifestEntries().map((entry) => buildSummary(entry, validLang, overrides));

  return <DraftDashboardContent lang={validLang} guides={guides} />;
}
