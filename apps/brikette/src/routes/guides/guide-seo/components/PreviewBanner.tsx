import type { GuideKey } from "@/routes.guides-helpers";

import { shouldShowPreviewBanner } from "../utils/preview";

interface PreviewBannerProps {
  guideKey: GuideKey;
  search?: string | null;
  label: string;
}

/**
 * Preview banner for draft/review guides.
 *
 * IMPORTANT: Always renders a container div (even when hidden) to maintain structural
 * hydration safety. This prevents `<div>` ↔ `<script>` mismatches when banner eligibility
 * differs between SSR and client (e.g., when search params diverge).
 */
export default function PreviewBanner({ guideKey, search, label }: PreviewBannerProps): JSX.Element {
  const shouldShow = shouldShowPreviewBanner(guideKey, search);

  // Always render a container to maintain stable DOM structure during hydration
  // When not eligible, render hidden container to avoid structural mismatches
  return (
    <div
      className={shouldShow ? "sticky top-0 w-full bg-amber-500/95 px-4 py-2 text-sm font-medium text-brand-heading" : "hidden"}
      suppressHydrationWarning
    >
      {shouldShow ? label : null}
    </div>
  );
}
