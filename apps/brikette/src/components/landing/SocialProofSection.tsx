/* eslint-disable ds/enforce-layout-primitives -- BRIK-DS-001: in-progress design-system migration */
// src/components/landing/SocialProofSection.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";

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
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(parsed);
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
    tRatings("snapshotAsOf", { date: snapshotMonthYear, defaultValue: `As of ${snapshotMonthYear}` }),
    `As of ${snapshotMonthYear}`
  );

  return (
    <section className="bg-brand-bg py-16 scroll-mt-24">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight text-brand-heading">
            {resolveTranslatedCopy(
              tLanding("socialProof.title", { defaultValue: FALLBACK_SOCIAL_PROOF_TITLE }),
              FALLBACK_SOCIAL_PROOF_TITLE
            )}
          </h2>
          <p className="mt-1.5 text-brand-text/70">
            {resolveTranslatedCopy(
              tLanding("socialProof.subtitle", { defaultValue: FALLBACK_SOCIAL_PROOF_SUBTITLE }),
              FALLBACK_SOCIAL_PROOF_SUBTITLE
            )}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-brand-text/40">
            {snapshotAsOfLabel}
          </p>
        </div>

        {/* 5-col grid: ratings 2 cols, testimonials 3 cols */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* Ratings */}
          <div className="flex flex-col gap-3 lg:col-span-2">
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
                <div
                  key={rating.provider}
                  className="flex items-center justify-between rounded-2xl border border-brand-outline/20 bg-brand-surface px-5 py-4 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-brand-heading">{providerLabel}</p>
                    <p className="mt-0.5 text-xs text-brand-text/60">{reviewText}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pl-4">
                    <Star className="size-5 text-brand-secondary" aria-hidden />
                    <span className="text-2xl font-bold tabular-nums text-brand-heading">
                      {rating.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
            {featured.map((item, index) => (
              <div
                key={`${item.text}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-brand-outline/15 bg-gradient-to-br from-brand-secondary/10 to-brand-bg p-5 shadow-sm"
              >
                <span aria-hidden className="select-none text-5xl font-bold leading-none text-brand-secondary/30">
                  &ldquo;
                </span>
                <p className="flex-1 text-sm leading-relaxed text-brand-text/80">{item.text}</p>
                {item.rating !== undefined && (
                  <div className="flex items-center gap-1.5 border-t border-brand-outline/10 pt-3">
                    <Star className="size-3.5 text-brand-secondary" aria-hidden />
                    <span className="text-xs font-semibold text-brand-heading">{item.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </Section>
    </section>
  );
});

export default SocialProofSection;
