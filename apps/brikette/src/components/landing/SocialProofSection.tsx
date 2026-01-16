// src/components/landing/SocialProofSection.tsx
import { Star } from "lucide-react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Grid, Section } from "@acme/ui/atoms";
import hotel from "@/config/hotel";
import type { AppLanguage } from "@/i18n.config";
import { Cluster, Inline, Stack } from "@/components/ui/flex";

type Testimonial = {
  rating?: number;
  text: string;
  datePublished?: string;
};

const SOURCE_KEYS: Record<string, string> = {
  Hostelworld: "hostelworld",
  "Booking.com": "booking",
};

const SocialProofSection = memo(function SocialProofSection({ lang }: { lang?: AppLanguage }): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const { t: tRatings, i18n } = useTranslation("ratingsBar", translationOptions);
  const { t: tTestimonials, ready } = useTranslation("testimonials", translationOptions);
  const ratings = hotel.ratings ?? [];

  const featured = useMemo(() => {
    if (!ready) return [] as Testimonial[];
    const raw = tTestimonials("hostelworld.featured", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as Testimonial[]).slice(0, 2) : [];
  }, [ready, tTestimonials]);

  if (!ratings.length && !featured.length) return null;

  const locale = lang ?? i18n.language ?? "en";

  return (
    <section className="bg-brand-surface py-12 scroll-mt-24 dark:bg-brand-text">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <Stack className="gap-2">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
            {tLanding("socialProof.title")}
          </h2>
          <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
            {tLanding("socialProof.subtitle")}
          </p>
        </Stack>

        <Grid columns={{ base: 1, md: 2 }} gap={4} className="mt-6">
          <Stack className="gap-3">
            {ratings.map((rating) => {
              const key = SOURCE_KEYS[rating.provider];
              const providerLabel = key
                ? (tRatings(`sources.${key}.label`, { defaultValue: rating.provider }) as string)
                : rating.provider;
              const formattedCount = rating.count.toLocaleString(locale);
              const reviewText = tRatings("countReviews", { count: rating.count, formattedCount });
              return (
                <Cluster
                  key={rating.provider}
                  className="items-center justify-between rounded-2xl border border-brand-outline/30 bg-brand-bg px-4 py-3 shadow-sm dark:border-white/10 dark:bg-brand-surface"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-heading dark:text-brand-surface">
                      {providerLabel}
                    </p>
                    <p className="text-xs text-brand-text/70 dark:text-brand-surface/70">{reviewText}</p>
                  </div>
                  <Inline
                    as="span"
                    className="gap-1 rounded-full bg-brand-surface/70 px-3 py-1 text-sm font-semibold text-brand-heading dark:bg-white/10 dark:text-brand-surface"
                  >
                    <Star className="size-4 text-brand-secondary" aria-hidden />
                    {rating.value.toFixed(1)}
                  </Inline>
                </Cluster>
              );
            })}
          </Stack>

          <Grid columns={{ base: 1, sm: 2 }} gap={4}>
            {featured.map((item, index) => (
              <Stack
                key={`${item.text}-${index}`}
                className="h-full gap-3 rounded-2xl border border-brand-outline/30 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-brand-surface"
              >
                <Inline className="gap-2 text-sm font-semibold text-brand-heading dark:text-brand-surface">
                  <Star className="size-4 text-brand-secondary" aria-hidden />
                  {item.rating ? item.rating.toFixed(1) : "-"}
                </Inline>
                <p className="text-sm leading-relaxed text-brand-text/80 dark:text-brand-surface/80">
                  &quot;{item.text}&quot;
                </p>
              </Stack>
            ))}
          </Grid>
        </Grid>
      </Section>
    </section>
  );
});

export default SocialProofSection;
