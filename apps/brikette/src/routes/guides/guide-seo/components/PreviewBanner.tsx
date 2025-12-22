import type { GuideKey } from "@/routes.guides-helpers";
import { shouldShowPreviewBanner } from "../utils/preview";

interface PreviewBannerProps {
  guideKey: GuideKey;
  search?: string | null;
  label: string;
}

export default function PreviewBanner({ guideKey, search, label }: PreviewBannerProps): JSX.Element | null {
  if (!shouldShowPreviewBanner(guideKey, search)) return null;
  return (
    <div className="sticky top-0 w-full bg-amber-500/95 px-4 py-2 text-sm font-medium text-brand-heading">
      {label}
    </div>
  );
}
