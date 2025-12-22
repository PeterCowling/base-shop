import { memo } from "react";
import type { JSX } from "react";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Grid, Section } from "./layout";
import { buildQuickLinksJsonLd } from "./jsonLd";
import type { AssistanceQuickLinksProps } from "./types";
import { useAssistanceTranslations } from "./translations";
import { useContactCta } from "./useContactCta";
import { useQuickLinksWithHref, useResolvedQuickLinks } from "./useQuickLinks";

const jsonLdType = `application/${["ld", "json"].join("+")}`;
const sectionId = "assistance-quick-links";

function AssistanceQuickLinksSection({ lang }: AssistanceQuickLinksProps): JSX.Element | null {
  const { resolvedLang, resolveAssistanceString, tAssistance, tAssistanceEn } =
    useAssistanceTranslations(lang);

  const heading = resolveAssistanceString("quickLinksHeading");
  const intro = resolveAssistanceString("quickLinksIntro");
  const readMoreLabel = resolveAssistanceString("cta.readMore");

  const quickLinks = useResolvedQuickLinks(resolvedLang, tAssistance, tAssistanceEn);
  const quickLinksWithHref = useQuickLinksWithHref(quickLinks, resolvedLang);
  const contactCta = useContactCta(tAssistance, tAssistanceEn);

  if (quickLinksWithHref.length === 0) {
    return null;
  }

  const jsonLd = buildQuickLinksJsonLd(resolvedLang, quickLinksWithHref);

  return (
    <Section
      aria-labelledby={sectionId}
      className={clsx("mt-10", "max-w-5xl")}
      data-testid={sectionId}
    >
      <script type={jsonLdType} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div
        className={clsx(
          "flex",
          "flex-col",
          "gap-6",
          "rounded-3xl",
          "border",
          "border-brand-outline/20",
          "bg-brand-bg/70",
          "p-6",
          "shadow-sm",
          "backdrop-blur",
          "dark:border-brand-surface/10",
          "dark:bg-brand-text/90",
          "sm:p-8",
        )}
      >
        <div className={clsx("flex", "flex-col", "gap-2")}>
          <h2
            id={sectionId}
            className={clsx("text-2xl", "font-semibold", "text-brand-heading", "dark:text-brand-surface")}
          >
            {heading}
          </h2>
          <p className={clsx("text-sm", "text-brand-text/80", "dark:text-brand-surface/80")}>{intro}</p>
        </div>

        <Grid>
          {quickLinksWithHref.map((item) => (
            <Link
              key={item.slug}
              to={item.href}
              prefetch="intent"
              className={clsx(
                "group",
                "block",
                "rounded-2xl",
                "border",
                "border-brand-outline/30",
                "bg-brand-bg/5",
                "p-5",
                "transition",
                "hover:border-brand-primary/60",
                "hover:bg-brand-primary/5",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-brand-primary",
                "dark:border-brand-surface/20",
                "dark:bg-brand-text/5",
                "dark:hover:border-brand-secondary/60",
                "dark:hover:bg-brand-secondary/5",
              )}
            >
              <h3 className={clsx("text-lg", "font-semibold", "text-brand-heading", "dark:text-brand-surface")}>
                {item.label}
              </h3>
              <p className={clsx("mt-2", "text-sm", "text-brand-text/80", "dark:text-brand-surface/80")}>
                {item.description}
              </p>
              <span
                className={clsx(
                  "mt-4",
                  "inline-flex",
                  "items-center",
                  "gap-1",
                  "text-sm",
                  "font-semibold",
                  "text-brand-primary",
                  "transition",
                  "group-hover:translate-x-1",
                  "dark:text-brand-secondary",
                )}
              >
                {readMoreLabel}
                <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              </span>
            </Link>
          ))}
        </Grid>

        {contactCta ? (
          <div className={clsx("pt-2")}>
            <a
              href={contactCta.href}
              className={clsx(
                "inline-flex",
                "min-h-11",
                "min-w-11",
                "items-center",
                "gap-2",
                "rounded-full",
                "bg-brand-primary",
                "px-5",
                "py-2",
                "text-sm",
                "font-semibold",
                "text-brand-bg",
                "shadow-sm",
                "transition",
                "hover:bg-brand-primary/90",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-brand-secondary",
                "dark:bg-brand-secondary",
                "dark:hover:bg-brand-secondary/90",
              )}
            >
              {contactCta.label}
              <ArrowUpRight aria-hidden className="size-4" strokeWidth={2} />
            </a>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export default memo(AssistanceQuickLinksSection);
