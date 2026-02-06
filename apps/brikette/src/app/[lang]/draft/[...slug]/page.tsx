import { notFound } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { listGuideManifestEntries, resolveDraftPathSegment } from "@/routes/guides/guide-manifest";
import { loadGuideManifestOverridesFromFs } from "@/routes/guides/guide-manifest-overrides.node";

import GuideContent from "../../experiences/[slug]/GuideContent";

export const dynamic = process.env.OUTPUT_EXPORT ? "force-static" : "force-dynamic";

// Static export: no draft pages (they require the Worker for SSR)
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ lang: string; slug: string[] }>;
};

export default async function DraftGuidePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const draftPath = Array.isArray(slug) ? slug.join("/") : slug;

  // Load manifest overrides server-side (includes SEO audit results and draftPathSegment overrides)
  const manifestOverrides = loadGuideManifestOverridesFromFs();

  // Find entry matching the draft path (considering overrides)
  const entry = listGuideManifestEntries().find((item) => {
    const overridePath = manifestOverrides[item.key]?.draftPathSegment;
    return resolveDraftPathSegment(item, overridePath) === draftPath;
  });

  if (!entry) {
    notFound();
  }

  return (
    <GuideContent
      lang={validLang}
      guideKey={entry.key}
      serverOverrides={manifestOverrides}
    />
  );
}
