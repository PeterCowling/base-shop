import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

export interface QuickLinkItem {
  label: string;
  description: string;
  slug?: GuideKey;
  href?: string;
}

export interface QuickLinkWithHref extends Omit<QuickLinkItem, 'href'> {
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
