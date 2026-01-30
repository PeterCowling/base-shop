import { notFound } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { listGuideManifestEntries, resolveDraftPathSegment } from "@/routes/guides/guide-manifest";
import { loadGuideManifestOverridesFromFs } from "@/routes/guides/guide-manifest-overrides.node";

import GuideContent from "../../experiences/[slug]/GuideContent";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string; slug: string[] }>;
};

export default async function DraftGuidePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = toAppLanguage(lang);
  const draftPath = Array.isArray(slug) ? slug.join("/") : slug;
  const entry = listGuideManifestEntries().find(
    (item) => resolveDraftPathSegment(item) === draftPath,
  );

  if (!entry) {
    notFound();
  }

  // Load manifest overrides server-side (includes SEO audit results)
  const manifestOverrides = loadGuideManifestOverridesFromFs();

  return (
    <GuideContent
      lang={validLang}
      guideKey={entry.key}
      serverOverrides={manifestOverrides}
    />
  );
}
