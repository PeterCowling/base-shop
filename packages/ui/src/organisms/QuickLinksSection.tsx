// packages/ui/src/organisms/QuickLinksSection.tsx
import { Files, Home, MapPin } from "lucide-react";
import type { FC, MouseEventHandler, ReactNode, SVGProps } from "react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { Section } from "../atoms/Section";
import { Grid } from "@/components/atoms/primitives/Grid";

export interface QuickLink {
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  to?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface QuickLinksSectionProps {
  lang: AppLanguage;
  onLocationClick?: () => void;
  onFacilitiesClick?: () => void;
}

const QuickLinkCard: FC<QuickLink> = memo(({ label, Icon, to, href, onClick }): ReactNode => {
  const container =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "group flex flex-col items-center justify-center rounded-xl bg-brand-bg/90 shadow-sm ring-1 ring-brand-surface/70 " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "dark:bg-brand-text dark:ring-brand-surface/20 transition hover:-translate-y-1 hover:shadow-md hover:ring-brand-surface " +
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 min-h-32 min-w-32 px-4 py-3";

  const icon =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "h-8 w-8 text-brand-text/70 transition-transform duration-200 group-hover:scale-110 group-hover:text-brand-text dark:text-brand-surface/70 dark:group-hover:text-brand-surface";

  const labelStyles =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "mt-3 text-center text-sm font-semibold leading-snug whitespace-normal break-words text-brand-text group-hover:text-brand-heading dark:text-brand-surface";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={container} aria-label={label}>
        <Icon className={icon} aria-hidden />
        <span className={labelStyles}>{label}</span>
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} prefetch="intent" className={container} aria-label={label}>
        <Icon className={icon} aria-hidden />
        <span className={labelStyles}>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={container} aria-label={label}>
      <Icon className={icon} aria-hidden />
      <span className={labelStyles}>{label}</span>
    </button>
  );
});

QuickLinkCard.displayName = "QuickLinkCard";

const QuickLinksSection: FC<QuickLinksSectionProps> = ({ lang, onLocationClick, onFacilitiesClick }) => {
  const { t, ready } = useTranslation("landingPage", { lng: lang });

  const links: QuickLink[] = useMemo(() => {
    if (!ready) return [];
    const locationLabel = t("quickLinksSection.location", {
      defaultValue: t("quickLinksSection.location", { lng: "en", defaultValue: "Location" }) as string,
    }) as string;
    const facilitiesLabel = t("quickLinksSection.facilitiesAndAmenities", {
      defaultValue: t("quickLinksSection.facilitiesAndAmenities", {
        lng: "en",
        defaultValue: "Facilities & Amenities",
      }) as string,
    }) as string;
    const barMenuLabel = t("quickLinksSection.barMenu", {
      defaultValue: t("quickLinksSection.barMenu", { lng: "en", defaultValue: "Bar Menu" }) as string,
    }) as string;
    const breakfastMenuLabel = t("quickLinksSection.breakfastMenu", {
      defaultValue: t("quickLinksSection.breakfastMenu", { lng: "en", defaultValue: "Breakfast Menu" }) as string,
    }) as string;

    const out: QuickLink[] = [
      {
        label: locationLabel,
        Icon: MapPin,
        href: "https://maps.app.goo.gl/2rnfYjF3YZB5wPqt8",
      },
      {
        label: facilitiesLabel,
        Icon: Home,
        to: `/${lang}/facilities`,
      },
      {
        label: barMenuLabel,
        Icon: Files,
        to: `/${lang}/${getSlug("barMenu", lang)}`,
      },
      {
        label: breakfastMenuLabel,
        Icon: Files,
        to: `/${lang}/${getSlug("breakfastMenu", lang)}`,
      },
    ];

    if (onLocationClick) out[0] = { ...out[0], href: undefined, onClick: onLocationClick };
    if (onFacilitiesClick) out[1] = { ...out[1], to: undefined, onClick: onFacilitiesClick };
    return out;
  }, [lang, onFacilitiesClick, onLocationClick, t, ready]);

  return (
    <Section as="section" padding="none" className="max-w-6xl px-4 py-10 lg:py-14">
      <Grid cols={2} gap={6} className="place-items-center sm:grid-cols-4">
        {links.map((link) => (
          <QuickLinkCard key={link.label} {...link} />
        ))}
      </Grid>
    </Section>
  );
};

export default memo(QuickLinksSection);
export { QuickLinksSection };
