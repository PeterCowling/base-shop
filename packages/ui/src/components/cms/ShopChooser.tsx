"use client";
/* eslint-disable ds/no-hardcoded-copy -- UI-1420: className literals and prop-driven content; user-facing strings wrapped with t() */

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@acme/telemetry";
import { Card, CardContent } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "../../utils/style";
import { Grid as DSGrid } from "../atoms/primitives/Grid";
import { useTranslations } from "@acme/i18n";

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
        "border border-white/20 bg-slate-950/80 text-white shadow-elevation-4",
        className
      )}
    >
      <CardContent className="space-y-6 px-6 py-6">
        {(tag || heading || subheading) && (
          <div className="space-y-2">
            {tag && (
              <Tag variant="default" className="bg-white/10 text-white">
                {tag}
              </Tag>
            )}
            {heading && (
              <h2 className="text-lg font-semibold text-white">{heading}</h2>
            )}
            {subheading && (
              <p className="text-sm text-white">{subheading}</p>
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
                      "group flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-white shadow-elevation-1 transition hover:border-white/40 hover:bg-white/15 focus-within:border-white/50 focus-within:bg-white/15",
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
                              "flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl",
                              card.iconWrapperClassName
                            )}
                          >
                            {card.icon}
                          </span>
                        )}
                        <div className="space-y-1">
                          <span className="block text-xs uppercase tracking-wide text-white">
                            {resolvedEyebrow}
                          </span>
                          <h3
                            id={cardTitleId}
                            className="text-lg font-semibold text-white"
                          >
                            {resolvedTitle}
                          </h3>
                        </div>
                      </div>
                      <p
                        id={descriptionId}
                        className="text-sm leading-relaxed text-white"
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
                        "mt-auto inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/30 bg-white/15 text-sm font-semibold text-white shadow-elevation-1 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
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
          <div className="space-y-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-6 text-white/80">
            {emptyState.tagLabel && (
              <Tag variant="warning" className="bg-amber-500/20 text-amber-100">
                {emptyState.tagLabel}
              </Tag>
            )}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                {emptyState.title}
              </h3>
              <p className="text-sm text-white/70">{emptyState.description}</p>
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
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-elevation-2 shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              {emptyState.ctaLabel}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
