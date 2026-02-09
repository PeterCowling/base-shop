import { notFound } from "next/navigation";

import { isGuideAuthoringEnabled } from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

import GuideEditor from "./GuideEditor";

export const dynamic = "force-dynamic";

export default async function GuideEditPage({
  params,
}: {
  params: Promise<{ guideKey: string }>;
}) {
  if (!isGuideAuthoringEnabled()) {
    notFound();
  }

  const { guideKey } = await params;

  const entries = listGuideManifestEntries();
  const entry = entries.find((e) => e.key === guideKey);
  if (!entry) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <GuideEditor
        guideKey={guideKey}
        contentKey={entry.contentKey}
        manifest={entry}
      />
    </main>
  );
}
