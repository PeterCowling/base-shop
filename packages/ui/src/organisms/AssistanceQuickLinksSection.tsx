// packages/ui/src/organisms/AssistanceQuickLinksSection.tsx
import type { ReactNode } from "react";
import { Fragment, memo } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "../atoms/Section";
import { Grid } from "../components/atoms/primitives/Grid";

export type AssistanceQuickLinkItem = {
  id?: string;
  href: string;
  label: string;
  description: string;
  image?: {
    src: string;
    alt?: string;
  };
};

export type AssistanceQuickLinksCta = {
  href: string;
  label: string;
};

export type AssistanceQuickLinkRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  ariaLabel?: string;
  prefetch?: boolean;
};

export interface AssistanceQuickLinksSectionProps {
  heading: string;
  intro?: string;
  readMoreLabel: string;
  items: AssistanceQuickLinkItem[];
  contactCta?: AssistanceQuickLinksCta | null;
  sectionId?: string;
  className?: string;
  jsonLd?: string;
  jsonLdType?: string;
  renderLink?: (props: AssistanceQuickLinkRenderProps) => ReactNode;
  renderCtaLink?: (props: AssistanceQuickLinkRenderProps) => ReactNode;
}

const defaultRenderLink = ({ href, className, children, ariaLabel }: AssistanceQuickLinkRenderProps): ReactNode => (
  <a href={href} className={className} aria-label={ariaLabel}>
    {children}
  </a>
);

const resolveKey = (item: AssistanceQuickLinkItem): string => {
  return item.id ?? item.href ?? item.label;
};

function AssistanceQuickLinksSection({
  heading,
  intro,
  readMoreLabel,
  items,
  contactCta,
  sectionId = "assistance-quick-links",
  className,
  jsonLd,
  jsonLdType = "application/ld+json",
  renderLink,
  renderCtaLink,
}: AssistanceQuickLinksSectionProps): JSX.Element | null {
  if (!items || items.length === 0) return null;

  const linkRenderer = renderLink ?? defaultRenderLink;
  const ctaRenderer = renderCtaLink ?? defaultRenderLink;

  return (
    <Section
      aria-labelledby={sectionId}
      className={clsx("mt-10 max-w-5xl px-4 sm:px-6 lg:px-8", className)}
      data-testid={sectionId}
      padding="none"
    >
      {jsonLd ? (
        <script type={jsonLdType} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}

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
          "dark:bg-brand-surface/80",
          "sm:p-8",
        )}
      >
        <div className={clsx("flex", "flex-col", "gap-2")}>
          <h2
            id={sectionId}
            className={clsx("text-2xl", "font-semibold", "text-brand-heading", "dark:text-brand-text")}
          >
            {heading}
          </h2>
          {intro ? (
            <p className={clsx("text-sm", "text-brand-text/80", "dark:text-brand-text/80")}>{intro}</p>
          ) : null}
        </div>

        <Grid cols={1} className="sm:grid-cols-2">
          {items.map((item) => {
            const key = resolveKey(item);
            return (
              <Fragment key={key}>
                {linkRenderer({
                  href: item.href,
                  ariaLabel: item.label,
                  className: clsx(
                    "group",
                    "block",
                    "h-full",
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
                    "dark:bg-brand-surface/30",
                    "dark:hover:border-brand-secondary/60",
                    "dark:hover:bg-brand-secondary/5",
                  ),
                  children: (
                    <>
                      <div className={clsx("flex", "flex-col", "h-full")}>
                        <div className={clsx("grid", "grid-cols-[4.5rem_1fr]", "gap-4", "items-start")}>
                          {item.image?.src ? (
                            <Image
                              src={item.image.src}
                              alt={item.image.alt ?? item.label}
                              width={64}
                              height={64}
                              className={clsx(
                                "h-16",
                                "w-16",
                                "rounded-xl",
                                "object-cover",
                                "border",
                                "border-brand-outline/20",
                                "bg-brand-surface/40",
                                "dark:border-brand-outline/30",
                                "dark:bg-brand-surface/50",
                              )}
                            />
                          ) : (
                            <div
                              aria-hidden
                              className={clsx(
                                "h-16",
                                "w-16",
                                "rounded-xl",
                                "border",
                                "border-brand-outline/20",
                                "bg-gradient-to-br",
                                "from-brand-primary/10",
                                "via-brand-outline/10",
                                "to-brand-surface/30",
                                "dark:border-brand-outline/30",
                                "dark:from-brand-secondary/10",
                                "dark:via-brand-outline/10",
                                "dark:to-brand-surface/40",
                              )}
                            />
                          )}
                          <div className={clsx("flex", "flex-col")}>
                            <h3
                              className={clsx("text-lg", "font-semibold", "text-brand-heading", "dark:text-brand-text")}
                            >
                              {item.label}
                            </h3>
                            <p
                              className={clsx(
                                "mt-2",
                                "text-sm",
                                "text-brand-text/80",
                                "dark:text-brand-text/80",
                                "overflow-hidden",
                                "[display:-webkit-box]",
                                "[-webkit-box-orient:vertical]",
                                "[-webkit-line-clamp:3]",
                                // visually normalise card heights
                                "min-h-[3.75rem]",
                              )}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
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
                      </div>
                    </>
                  ),
                })}
              </Fragment>
            );
          })}

          {contactCta ? (
            <Fragment>
              {ctaRenderer({
                href: contactCta.href,
                ariaLabel: contactCta.label,
                className: clsx(
                  "group",
                  "flex",
                  "min-h-[6.5rem]",
                  "items-center",
                  "justify-center",
                  "gap-3",
                  "rounded-2xl",
                  "bg-brand-primary",
                  "px-6",
                  "py-6",
                  "text-base",
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
                ),
                children: (
                  <>
                    <span className="text-lg">{contactCta.label}</span>
                    <ArrowUpRight
                      aria-hidden
                      className={clsx("size-5", "transition-transform", "group-hover:-translate-y-0.5", "group-hover:translate-x-0.5")}
                      strokeWidth={2}
                    />
                  </>
                ),
              })}
            </Fragment>
          ) : null}
        </Grid>
      </div>
    </Section>
  );
}

export default memo(AssistanceQuickLinksSection);
export { AssistanceQuickLinksSection };
