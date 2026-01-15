// packages/ui/src/organisms/QuickLinksSection.tsx
import { BedDouble, BookOpen, MapPin, Sparkles } from "lucide-react";
import type { FC, ReactNode, SVGProps } from "react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@ui/i18n.config";
import { Section } from "../atoms/Section";
import { Grid } from "@ui/components/atoms/primitives/Grid";

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
    "group flex h-full min-h-[120px] flex-col items-start gap-3 rounded-2xl border border-brand-outline/30 bg-white/90 p-5 text-start shadow-sm backdrop-blur " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "dark:bg-brand-text dark:border-white/10 transition hover:-translate-y-1 hover:shadow-lg " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";

  const iconWrapper =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "inline-flex size-10 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-primary shadow-sm transition group-hover:scale-105 dark:bg-brand-surface/20";

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
    <a href={href} className={container} aria-label={label}>
      <span className={iconWrapper} aria-hidden>
        <Icon className={icon} />
      </span>
      <span className={labelStyles}>{label}</span>
      <span className={descriptionStyles}>{description}</span>
    </a>
  );
});

QuickLinkCard.displayName = "QuickLinkCard";

const QuickLinksSection: FC<QuickLinksSectionProps> = ({ lang }) => {
  const { t, ready } = useTranslation("landingPage", { lng: lang });

  const links: QuickLink[] = useMemo(() => {
    if (!ready) return [];
    return [
      {
        label: t("quickLinksSection.rooms", { defaultValue: "Rooms" }) as string,
        description: t("quickLinksSection.roomsHint", { defaultValue: "Dorms and private rooms" }) as string,
        Icon: BedDouble,
        href: "#rooms",
      },
      {
        label: t("quickLinksSection.commonAreas", { defaultValue: "Common areas" }) as string,
        description: t("quickLinksSection.commonAreasHint", { defaultValue: "Terrace, bar, shared spaces" }) as string,
        Icon: Sparkles,
        href:
          /* i18n-exempt -- UI-1000 ttl=2026-12-31 anchor id. */
          "#common-areas",
      },
      {
        label: t("quickLinksSection.location", { defaultValue: "Location" }) as string,
        description: t("quickLinksSection.locationHint", { defaultValue: "Bus stop and beach tips" }) as string,
        Icon: MapPin,
        href: "#location",
      },
      {
        label: t("quickLinksSection.guides", { defaultValue: "Guides" }) as string,
        description: t("quickLinksSection.guidesHint", { defaultValue: "Local tips for your trip" }) as string,
        Icon: BookOpen,
        href: "#guides",
      },
    ];
  }, [t, ready]);

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
