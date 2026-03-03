// packages/ui/src/organisms/QuickLinksSection.tsx
import type { FC, ReactNode, SVGProps } from "react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { BedDouble, BookOpen, MapPin, Sparkles } from "lucide-react";

import { Section } from "../atoms/Section";
import { Grid } from "../components/atoms/primitives/Grid";
import type { AppLanguage } from "../i18n.config";
import { translatePath } from "../utils/translate-path";

export interface QuickLink {
  label: string;
  description: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  href: string;
}

interface QuickLinksSectionProps {
  lang: AppLanguage;
}

const QuickLinkCard: FC<QuickLink> = memo(({ label, description, Icon, href }): ReactNode => {
  const container =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "group flex h-full min-h-[120px] flex-col items-start gap-3 rounded-2xl border border-brand-outline/30 bg-surface/90 p-5 text-start shadow-sm backdrop-blur " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "dark:bg-brand-text dark:border-primary-fg/10 transition hover:-translate-y-1 hover:shadow-lg " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";

  const iconWrapper =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "inline-flex size-11 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-primary shadow-sm transition group-hover:scale-105 dark:bg-brand-surface/20";

  const icon =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "h-5 w-5";

  const labelStyles =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "text-base font-semibold leading-tight text-brand-heading dark:text-brand-surface";

  const descriptionStyles =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "text-sm leading-snug text-brand-text/70 dark:text-brand-surface/70";

  return (
    <Link href={href} prefetch={true} className={container}>
      <span className={iconWrapper} aria-hidden>
        <Icon className={icon} />
      </span>
      <span className={labelStyles}>{label}</span>
      <span className={descriptionStyles}>{description}</span>
    </Link>
  );
});

QuickLinkCard.displayName = "QuickLinkCard";

const QuickLinksSection: FC<QuickLinksSectionProps> = ({ lang }) => {
  const { t, ready } = useTranslation("landingPage", { lng: lang });

  const links: QuickLink[] = useMemo(() => {
    if (!ready) return [];
    return [
      {
        label: t("quickLinksSection.rooms", { defaultValue: "Dorms" }) as string,
        description: t("quickLinksSection.roomsHint", { defaultValue: "Mixed and female dormitories" }) as string,
        Icon: BedDouble,
        href: `/${lang}/${translatePath("rooms", lang)}`,
      },
      {
        label: t("quickLinksSection.commonAreas", { defaultValue: "Experiences" }) as string,
        description: t("quickLinksSection.commonAreasHint", { defaultValue: "Activities and local adventures" }) as string,
        Icon: Sparkles,
        href: `/${lang}/${translatePath("experiences", lang)}`,
      },
      {
        label: t("quickLinksSection.location", { defaultValue: "How to get here" }) as string,
        description: t("quickLinksSection.locationHint", { defaultValue: "Bus stop and beach tips" }) as string,
        Icon: MapPin,
        href: `/${lang}/${translatePath("howToGetHere", lang)}`,
      },
      {
        label: t("quickLinksSection.guides", { defaultValue: "Guides" }) as string,
        description: t("quickLinksSection.guidesHint", { defaultValue: "Local tips for your trip" }) as string,
        Icon: BookOpen,
        href: `/${lang}/${translatePath("guides", lang)}`,
      },
    ];
  }, [lang, ready, t]);

  return (
    <Section as="section" padding="none" className="max-w-6xl px-6 py-6 sm:py-8 lg:py-10">
      <Grid cols={2} gap={3} className="lg:grid-cols-4 sm:gap-4">
        {links.map((link) => (
          <QuickLinkCard key={link.label} {...link} />
        ))}
      </Grid>
    </Section>
  );
};

export default memo(QuickLinksSection);
export { QuickLinksSection };
