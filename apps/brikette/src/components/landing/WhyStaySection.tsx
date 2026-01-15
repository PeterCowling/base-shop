// src/components/landing/WhyStaySection.tsx
import { Compass, Sparkles, Users } from "lucide-react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Grid, Section } from "@acme/ui/atoms";
import type { AppLanguage } from "@/i18n.config";
import { Inline, Stack } from "@/components/ui/flex";

type HighlightItem = {
  title: string;
  text: string;
};

const ICONS = [Sparkles, Users, Compass] as const;

const WhyStaySection = memo(function WhyStaySection({ lang }: { lang?: AppLanguage }): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, ready } = useTranslation("landingPage", translationOptions);
  const items = useMemo(() => {
    if (!ready) return [] as HighlightItem[];
    const raw = t("whyStaySection.items", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as HighlightItem[]) : [];
  }, [ready, t]);

  if (!items.length) return null;

  return (
    <section id="why-stay" className="bg-brand-surface py-12 scroll-mt-24 dark:bg-brand-text">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
          {t("whyStaySection.title")}
        </h2>
        <Grid columns={{ base: 1, md: 3 }} gap={4} className="mt-6">
          {items.map((item, index) => {
            const Icon = ICONS[index] ?? Sparkles;
            return (
              <Stack
                key={item.title}
                className="h-full gap-3 rounded-2xl border border-brand-outline/30 bg-brand-bg p-5 shadow-sm dark:border-white/10 dark:bg-brand-surface"
              >
                <Inline
                  as="span"
                  className="size-10 justify-center rounded-full bg-brand-surface/70 text-brand-primary dark:bg-white/10"
                >
                  <Icon className="size-5" aria-hidden />
                </Inline>
                <h3 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-text/70 dark:text-brand-surface/70">
                  {item.text}
                </p>
              </Stack>
            );
          })}
        </Grid>
      </Section>
    </section>
  );
});

export default WhyStaySection;
