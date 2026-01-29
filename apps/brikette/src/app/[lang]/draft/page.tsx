// src/app/[lang]/draft/page.tsx
// Draft guides dashboard - App Router version
import type { Metadata } from "next";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import {
  buildGuideChecklist,
  listGuideManifestEntries,
  resolveDraftPathSegment,
  type GuideManifestEntry,
} from "@/routes/guides/guide-manifest";
import type { GuideSeoTemplateProps } from "@/routes/guides/guide-seo/types";
import type { AppLanguage } from "@/i18n.config";

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

function buildSummary(entry: GuideManifestEntry, lang: AppLanguage): DraftGuideSummary {
  return {
    key: entry.key,
    slug: entry.slug,
    status: entry.status,
    areas: entry.areas,
    primaryArea: entry.primaryArea,
    checklist: buildGuideChecklist(entry, { includeDiagnostics: true, lang }),
    draftPath: resolveDraftPathSegment(entry),
  };
}

export default async function DraftPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  // Fetch guide data on the server to ensure consistent SSR/hydration
  const guides = listGuideManifestEntries().map((entry) => buildSummary(entry, validLang));

  return <DraftDashboardContent lang={validLang} guides={guides} />;
}
