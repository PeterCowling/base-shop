import Link from "next/link";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { EXPERIENCE_GUIDE_KEYS, isGuideLive } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { guideHref, type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import { TRANSPORT_MODE_ICONS } from "../transport";
import type { ExperienceGuidesContent } from "../types";
import { Cluster, Inline, Stack } from "../ui";

export type ExperienceGuidesSectionProps = {
  content: ExperienceGuidesContent;
  lang: AppLanguage;
  t: TFunction<"howToGetHere">;
};

const EXPERIENCE_GUIDE_KEY_SET = new Set<GuideKey>(EXPERIENCE_GUIDE_KEYS);

function resolveGuideHref(lang: AppLanguage, guideKey: GuideKey) {
  if (EXPERIENCE_GUIDE_KEY_SET.has(guideKey)) {
    const experiencesSlug = getSlug("experiences", lang);
    const slug = guideSlug(lang, guideKey);
    return `/${lang}/${experiencesSlug}/${slug}`;
  }

  return guideHref(lang, guideKey);
}

const badgeClassName = clsx(
  "inline-flex",
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "border-brand-outline/20",
  "bg-brand-primary/5",
  "px-3",
  "py-1",
  "text-xs",
  "font-semibold",
  "uppercase",
  "tracking-wide",
  "text-brand-primary",
  "transition",
  "group-hover:border-brand-primary/30",
  "group-hover:bg-brand-primary/10",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/20",
  "dark:text-brand-text",
);

export function ExperienceGuidesSection({ content, lang, t }: ExperienceGuidesSectionProps) {
  const publishedItems = content.items.filter((item) => isGuideLive(item.guideKey));

  if (!publishedItems.length) {
    return null;
  }

  const columns = (publishedItems.length >= 3 ? 3 : publishedItems.length === 2 ? 2 : 1) as 1 | 2 | 3;
  const columnsClass =
    columns === 1
      ? "md:grid-cols-1"
      : columns === 2
      ? "md:grid-cols-2"
      : "md:grid-cols-3";

  return (
    <section className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60">
      <header className="space-y-3 text-brand-text dark:text-brand-text/80">
        {content.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">
            {content.eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">{content.title}</h2>
        {content.description ? (
          <p className="text-base leading-relaxed">{content.description}</p>
        ) : null}
      </header>

      <ul className={`mt-6 grid grid-cols-1 gap-5 ${columnsClass}`}>
        {publishedItems.map((item) => {
          const href = resolveGuideHref(lang, item.guideKey);
          const [primaryMode] = item.transportModes;
          const PrimaryIcon = primaryMode ? TRANSPORT_MODE_ICONS[primaryMode] : null;

          return (
            <li key={item.guideKey} className="h-full">
              <Stack
                asChild
                className="group flex h-full flex-col justify-between rounded-2xl border border-brand-outline/30 bg-brand-surface/80 p-5 text-start shadow-sm transition hover:border-brand-primary/40 hover:shadow-md dark:border-brand-outline/20 dark:bg-brand-surface/70"
              >
                <Link prefetch={true} href={href}>
                <Stack className="gap-3">
                  <Inline className="w-full gap-3 text-start">
                    {PrimaryIcon ? (
                      <Inline
                        asChild
                        className="size-10 justify-center rounded-full bg-brand-primary/10 text-brand-primary transition group-hover:bg-brand-primary/15 dark:bg-brand-secondary/20 dark:text-brand-secondary"
                      >
                        <span>
                        <PrimaryIcon aria-hidden className="size-5" />
                        </span>
                      </Inline>
                    ) : null}
                  <span className="text-lg font-semibold text-brand-heading dark:text-brand-text">
                    {item.label}
                  </span>
                </Inline>
                {item.summary ? (
                  <p className="text-sm leading-relaxed text-brand-text dark:text-brand-text/80">
                    {item.summary}
                  </p>
                ) : null}
                </Stack>
                {item.transportModes.length ? (
                  <Cluster className="mt-4">
                    {item.transportModes.map((mode) => {
                      const ModeIcon = TRANSPORT_MODE_ICONS[mode];
                      const label = t(`filters.transportModes.${mode}`) as string;
                      return (
                        <span key={`${item.guideKey}-${mode}`} className={badgeClassName}>
                          {ModeIcon ? <ModeIcon aria-hidden className="size-3.5" /> : null}
                          {label}
                        </span>
                      );
                    })}
                  </Cluster>
                ) : null}
                </Link>
              </Stack>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
