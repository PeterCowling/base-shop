/* eslint-disable ds/enforce-layout-primitives -- BRIK-DS-001: in-progress design-system migration */
// src/components/landing/SocialProofSection.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";

import { Cluster, Inline, Stack } from "@/components/ui/flex";
import hotel, { RATINGS_SNAPSHOT_DATE } from "@/config/hotel";
import type { AppLanguage } from "@/i18n.config";
import { Star } from "@/icons";

type Testimonial = {
  rating?: number;
  text: string;
  datePublished?: string;
};

const SOURCE_KEYS: Record<string, string> = {
  Hostelworld: "hostelworld",
  "Booking.com": "booking",
};
const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;
const FALLBACK_SOCIAL_PROOF_TITLE =
  // i18n-exempt -- BRIK-1267 [ttl=2026-12-31] fallback copy for missing locale bundles.
  "Guests love Brikette";
const FALLBACK_SOCIAL_PROOF_SUBTITLE =
  // i18n-exempt -- BRIK-1267 [ttl=2026-12-31] fallback copy for missing locale bundles.
  "Top ratings and recent reviews from travelers.";

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

function formatSnapshotMonthYear(isoDate: string, locale: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

const SocialProofSection = memo(function SocialProofSection({ lang }: { lang?: AppLanguage }): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const { t: tRatings, i18n } = useTranslation("ratingsBar", translationOptions);
  const { t: tTestimonials, ready } = useTranslation("testimonials", translationOptions);
  const ratings = hotel.ratings ?? [];

  const featured: Testimonial[] = (() => {
    if (!ready) return [];
    const raw = tTestimonials("hostelworld.featured", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as Testimonial[]).slice(0, 2) : [];
  })();

  if (!ratings.length && !featured.length) return null;

  const locale = lang ?? i18n.language ?? "en";
  const snapshotMonthYear = formatSnapshotMonthYear(RATINGS_SNAPSHOT_DATE, locale);
  const snapshotAsOfLabel = resolveTranslatedCopy(
    tRatings("snapshotAsOf", {
      date: snapshotMonthYear,
      defaultValue: `As of ${snapshotMonthYear}`,
    }),
    `As of ${snapshotMonthYear}`
  );

  return (
    <section className="bg-brand-surface py-12 scroll-mt-24 dark:bg-brand-surface">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <Stack className="gap-2">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">
            {resolveTranslatedCopy(
              tLanding("socialProof.title", { defaultValue: FALLBACK_SOCIAL_PROOF_TITLE }),
              FALLBACK_SOCIAL_PROOF_TITLE
            )}
          </h2>
          <p className="text-sm text-brand-text/70 dark:text-brand-text/70">
            {resolveTranslatedCopy(
              tLanding("socialProof.subtitle", {
                defaultValue: FALLBACK_SOCIAL_PROOF_SUBTITLE,
              }),
              FALLBACK_SOCIAL_PROOF_SUBTITLE
            )}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text/70 dark:text-brand-text/70">
            {snapshotAsOfLabel}
          </p>
        </Stack>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-6">
          <Stack className="gap-3">
            {ratings.map((rating) => {
              const key = SOURCE_KEYS[rating.provider];
              const providerLabel = key
                ? resolveTranslatedCopy(
                    tRatings(`sources.${key}.label`, { defaultValue: rating.provider }),
                    rating.provider
                  )
                : rating.provider;
              const formattedCount = rating.count.toLocaleString(locale);
              const reviewText = resolveTranslatedCopy(
                tRatings("countReviews", { count: rating.count, formattedCount }),
                `${formattedCount} reviews`
              );
              return (
                <Cluster
                  key={rating.provider}
                  className="items-center justify-between rounded-2xl border border-brand-outline/30 bg-brand-bg px-4 py-3 shadow-sm border-fg-inverse/10 dark:bg-brand-surface"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-heading dark:text-brand-text">
                      {providerLabel}
                    </p>
                    <p className="text-xs text-brand-text/70 dark:text-brand-text/70">{reviewText}</p>
                  </div>
                  <Inline
                    as="span"
                    className="gap-1 rounded-full bg-brand-surface/70 px-3 py-1 text-sm font-semibold text-brand-heading bg-fg-inverse/10 dark:text-brand-text"
                  >
                    <Star className="size-4 text-brand-secondary" aria-hidden />
                    {rating.value.toFixed(1)}
                  </Inline>
                </Cluster>
              );
            })}
          </Stack>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {featured.map((item, index) => (
              <Stack
                key={`${item.text}-${index}`}
                className="h-full gap-3 rounded-2xl border border-brand-outline/30 bg-panel/80 p-5 shadow-sm border-fg-inverse/10 dark:bg-brand-surface"
              >
                <Inline className="gap-2 text-sm font-semibold text-brand-heading dark:text-brand-text">
                  <Star className="size-4 text-brand-secondary" aria-hidden />
                  {item.rating ? item.rating.toFixed(1) : "-"}
                </Inline>
                <p className="text-sm leading-relaxed text-brand-text/80 dark:text-brand-text/80">
                  &quot;{item.text}&quot;
                </p>
              </Stack>
            ))}
          </div>
        </div>
      </Section>
    </section>
  );
});

export default SocialProofSection;
