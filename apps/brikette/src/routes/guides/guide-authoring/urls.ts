import { PREVIEW_TOKEN } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

export function buildGuideEditUrl(lang: AppLanguage, guideKey: GuideKey): string {
  const base = `/${lang}/draft/edit/${guideKey}`;
  if (!PREVIEW_TOKEN) return base;
  const params = new URLSearchParams({ preview: PREVIEW_TOKEN });
  return `${base}?${params.toString()}`;
}
