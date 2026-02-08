/* eslint-disable ds/enforce-layout-primitives -- BRIK-DS-001: in-progress design-system migration */
// src/components/landing/FaqStrip.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";
import { translatePath } from "@acme/ui/utils/translate-path";

import { Cluster } from "@/components/ui/flex";
import type { AppLanguage } from "@/i18n.config";
import { toAppLanguage } from "@/utils/lang";

type FaqItem = {
  question: string;
  answer: string;
};

const FaqStrip = memo(function FaqStrip({ lang }: { lang?: AppLanguage }): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const { t, ready } = useTranslation("faq", translationOptions);
  const resolvedLang = toAppLanguage(lang);
  const items: FaqItem[] = (() => {
    if (!ready) return [];
    const raw = t("items", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as FaqItem[]).slice(0, 4) : [];
  })();

  if (!items.length) return null;

  return (
    <section id="faq" className="py-12 scroll-mt-24">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <Cluster className="items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">
            {tLanding("faqSection.title")}
          </h2>
          <Link
            href={`/${resolvedLang}/${translatePath("assistance", resolvedLang)}`}
            className="text-sm font-semibold text-brand-primary underline-offset-4 transition hover:underline"
          >
            {tLanding("faqSection.ctaLabel")}
          </Link>
        </Cluster>

        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 list-none">
          {items.map((item) => (
            <li
              key={item.question}
              className="rounded-2xl border border-brand-outline/30 bg-brand-bg p-4 shadow-sm dark:border-white/10 dark:bg-brand-surface"
            >
              <h3 className="text-sm font-semibold text-brand-heading dark:text-brand-text">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text/70 dark:text-brand-text/70">
                {item.answer}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </section>
  );
});

export default FaqStrip;
