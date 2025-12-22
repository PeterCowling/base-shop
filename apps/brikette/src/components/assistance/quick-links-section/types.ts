import type { AppLanguage } from "@/i18n.config";
import type { HelpArticleKey } from "@/routes.assistance-helpers";

export interface QuickLinkItem {
  label: string;
  description: string;
  slug: HelpArticleKey;
}

export interface QuickLinkWithHref extends QuickLinkItem {
  href: string;
}

export interface ResolvedQuickLinks {
  items: QuickLinkItem[];
  sourceLang: AppLanguage;
}

export interface ContactCta {
  label: string;
  href: string;
}

export interface AssistanceQuickLinksProps {
  lang?: string;
}
