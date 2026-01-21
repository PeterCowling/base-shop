import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms/Section";

import { Cluster, Stack } from "@/components/ui/flex";
import type { AppLanguage } from "@/i18n.config";

const BOOKING_LINKS = {
  googleBusiness: "https://maps.google.com/maps?cid=17733313080460471781",
  bookingCom: "https://www.booking.com/hotel/it/positano-hostel.en-gb.html",
  hostelWorld: "https://www.hostelworld.com/hostels/p/7763/hostel-brikette/",
  instagram: "https://www.instagram.com/brikettepositano",
} as const;

type BookingLinkKey = keyof typeof BOOKING_LINKS;

function AssistanceHero({ lang }: { lang: AppLanguage }) {
  const { t } = useTranslation("assistanceSection", { lng: lang });
  const heroIntroKey = "heroIntro" as const;
  const raw = t(heroIntroKey) as string;
  const heroIntro = raw && raw !== heroIntroKey ? raw : ((t("amaParagraph1") as string) || "");
  const bookingOptions = (t("bookingOptions", { returnObjects: true }) || {}) as Partial<
    Record<BookingLinkKey, string>
  >;

  return (
    <Section padding="none" width="full" className="mx-auto mt-35 max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-bg via-brand-bg to-brand-bg/70 p-8 shadow-sm dark:border-brand-text/10 dark:from-brand-text dark:via-brand-text/95 dark:to-brand-text/90">
        <Stack className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <Section as="div" padding="none" width="full" className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
              {t("heading")}
            </p>
            <h2 className="text-3xl font-bold leading-tight text-brand-heading dark:text-brand-surface">
              {t("subheading")}
            </h2>
            <p className="text-base text-brand-text/80 dark:text-brand-surface/80">{heroIntro}</p>
          </Section>
          <Section
            as="div"
            padding="none"
            width="full"
            className="w-full max-w-sm rounded-2xl bg-brand-bg/80 p-6 shadow-inner backdrop-blur dark:bg-brand-surface/60"
          >
            <p className="text-sm font-semibold text-brand-heading dark:text-brand-surface">
              {t("otherBookingOptions")}
            </p>
            <Cluster as="div" className="mt-3">
              {(Object.entries(BOOKING_LINKS) as [BookingLinkKey, string][])
                .filter(([key]) => Boolean(bookingOptions?.[key]))
                .map(([key, href]) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 min-w-11 items-center rounded-full border border-brand-outline/30 px-4 text-sm font-medium text-brand-primary underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:border-brand-surface/30 dark:text-brand-secondary"
                  >
                    {bookingOptions[key]}
                  </a>
                ))}
            </Cluster>
          </Section>
        </Stack>
      </div>
    </Section>
  );
}

export default memo(AssistanceHero);
