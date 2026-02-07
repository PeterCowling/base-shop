"use client";
 

import type { ReactNode } from "react";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";

import { cn } from "../../utils/style";
import { Tag } from "../atoms";
import { Grid as DSGrid } from "../atoms/primitives/Grid";
import { Card, CardContent } from "../atoms/shadcn";

export type ValueOrFactory<T> = T | ((shop: string) => T);

interface ShopChooserCardConfig {
  icon?: ReactNode;
  iconWrapperClassName?: string;
  eyebrow?: ValueOrFactory<string>;
  title?: ValueOrFactory<string>;
  description: ValueOrFactory<string>;
  ctaLabel: ValueOrFactory<string>;
  href: (shop: string) => string;
  analyticsEventName?: string;
  analyticsPayload?: (shop: string) => Record<string, unknown>;
  cardClassName?: string;
  ctaClassName?: string;
}

interface ShopChooserEmptyState {
  tagLabel?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  analyticsEventName?: string;
  analyticsPayload?: Record<string, unknown>;
}

export interface ShopChooserProps {
  shops: string[];
  heading?: string;
  subheading?: string;
  tag?: string;
  card: ShopChooserCardConfig;
  emptyState: ShopChooserEmptyState;
  className?: string;
}

function resolveValue<T>(
  value: ValueOrFactory<T> | undefined,
  shop: string,
  fallback: T
): T {
  if (typeof value === "function") {
    return (value as (shop: string) => T)(shop);
  }
  return value ?? fallback;
}

function handleTrack(
  eventName?: string,
  payload?: Record<string, unknown>
): void {
  if (!eventName) return;
  track(eventName, payload ?? {});
}

export default function ShopChooser({
  shops,
  heading,
  subheading,
  tag,
  card,
  emptyState,
  className,
}: ShopChooserProps) {
  const t = useTranslations();
  return (
    <Card
      className={cn(
        "border border-border bg-surface-2 text-foreground shadow-elevation-4",
        className
      )}
    >
      <CardContent className="space-y-6 px-6 py-6">
        {(tag || heading || subheading) && (
          <div className="space-y-2">
            {tag && (
              <Tag variant="default" className="bg-muted text-foreground">
                {tag}
              </Tag>
            )}
            {heading && (
              <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
            )}
            {subheading && (
              <p className="text-sm text-muted-foreground">{subheading}</p>
            )}
          </div>
        )}

        {shops.length > 0 ? (
          <DSGrid cols={1} gap={4} className="sm:grid-cols-2 xl:grid-cols-3" role="list">
            {shops.map((shop, index) => {
              const cardTitleId = `shop-chooser-${index}-title`;
              const descriptionId = `shop-chooser-${index}-description`;
              const resolvedEyebrow = resolveValue(card.eyebrow, shop, t("Shop") as string);
              const resolvedTitle = resolveValue(card.title, shop, shop);
              const resolvedDescription = resolveValue(
                card.description,
                shop,
                ""
              );
              const resolvedCtaLabel = resolveValue(
                card.ctaLabel,
                shop,
                t("Open") as string
              );
              const href = card.href(shop);

              return (
                <div key={shop} role="listitem">
                  <article
                    className={cn(
                      "group flex h-full flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-sm text-foreground shadow-elevation-1 transition hover:border-border hover:bg-muted focus-within:border-ring focus-within:bg-muted",
                      card.cardClassName
                    )}
                    aria-labelledby={cardTitleId}
                    aria-describedby={descriptionId}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {card.icon && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl",
                              card.iconWrapperClassName
                            )}
                          >
                            {card.icon}
                          </span>
                        )}
                        <div className="space-y-1">
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                            {resolvedEyebrow}
                          </span>
                          <h3
                            id={cardTitleId}
                            className="text-lg font-semibold text-foreground"
                          >
                            {resolvedTitle}
                          </h3>
                        </div>
                      </div>
                      <p
                        id={descriptionId}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {resolvedDescription}
                      </p>
                    </div>

                    <Link
                      href={href}
                      data-cy="shop-chooser-cta"
                      data-index={index}
                      aria-labelledby={cardTitleId}
                      aria-describedby={descriptionId}
                      onClick={() =>
                        handleTrack(
                          card.analyticsEventName,
                          card.analyticsPayload?.(shop)
                        )
                      }
                      className={cn(
                        "mt-auto inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-secondary text-sm font-semibold text-secondary-foreground shadow-elevation-1 transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        card.ctaClassName
                      )}
                    >
                      <span className="sr-only">{shop}</span>
                      <span aria-hidden="true">{resolvedCtaLabel}</span>
                    </Link>
                  </article>
                </div>
              );
            })}
          </DSGrid>
        ) : (
          <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-6 text-muted-foreground">
            {emptyState.tagLabel && (
              <Tag variant="warning" className="bg-muted text-foreground">
                {emptyState.tagLabel}
              </Tag>
            )}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {emptyState.title}
              </h3>
              <p className="text-sm text-muted-foreground">{emptyState.description}</p>
            </div>
            <Link
              href={emptyState.ctaHref}
              data-cy="shop-chooser-empty-cta"
              onClick={() =>
                handleTrack(
                  emptyState.analyticsEventName,
                  emptyState.analyticsPayload
                )
              }
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-elevation-2 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {emptyState.ctaLabel}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
