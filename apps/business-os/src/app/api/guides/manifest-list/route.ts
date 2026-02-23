import { type NextRequest, NextResponse } from "next/server";

import {
  isGuideAuthoringEnabled,
  isPreviewHeaderAllowed,
} from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isGuideAuthoringEnabled() || !isPreviewHeaderAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const guides = listGuideManifestEntries()
    .map((entry) => ({
      key: entry.key,
      label: entry.slug || entry.key,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return NextResponse.json({ ok: true, guides });
}
