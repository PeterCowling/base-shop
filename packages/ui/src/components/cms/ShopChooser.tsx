"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@acme/telemetry";
import { Button, Card, CardContent } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "../../utils/style";

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
  return (
    <Card
      className={cn(
        "border border-white/10 bg-slate-950/70 text-white shadow-lg",
        className
      )}
    >
      <CardContent className="space-y-6 px-6 py-6">
        {(tag || heading || subheading) && (
          <div className="space-y-2">
            {tag && (
              <Tag variant="default" className="bg-white/10 text-white/70">
                {tag}
              </Tag>
            )}
            {heading && (
              <h2 className="text-lg font-semibold text-white">{heading}</h2>
            )}
            {subheading && (
              <p className="text-sm text-white/70">{subheading}</p>
            )}
          </div>
        )}

        {shops.length > 0 ? (
          <ul
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            role="list"
          >
            {shops.map((shop, index) => {
              const cardTitleId = `shop-chooser-${index}-title`;
              const descriptionId = `shop-chooser-${index}-description`;
              const resolvedEyebrow = resolveValue(card.eyebrow, shop, "Shop");
              const resolvedTitle = resolveValue(card.title, shop, shop);
              const resolvedDescription = resolveValue(
                card.description,
                shop,
                ""
              );
              const resolvedCtaLabel = resolveValue(
                card.ctaLabel,
                shop,
                "Open"
              );
              const href = card.href(shop);

              return (
                <li key={shop}>
                  <article
                    className={cn(
                      "group flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white shadow-sm transition hover:border-white/40 hover:bg-white/10 focus-within:border-white/50 focus-within:bg-white/10",
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
                          <span className="block text-xs uppercase tracking-wide text-white/50">
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
                        className="text-sm leading-relaxed text-white/70"
                      >
                        {resolvedDescription}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className={cn(
                        "mt-auto h-11 w-full rounded-xl border-white/30 bg-white/10 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 focus-visible:ring-white/60",
                        card.ctaClassName
                      )}
                    >
                      <Link
                        href={href}
                        data-cy="shop-chooser-cta"
                        aria-labelledby={cardTitleId}
                        aria-describedby={descriptionId}
                        onClick={() =>
                          handleTrack(
                            card.analyticsEventName,
                            card.analyticsPayload?.(shop)
                          )
                        }
                      >
                        {resolvedCtaLabel}
                      </Link>
                    </Button>
                  </article>
                </li>
              );
            })}
          </ul>
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
            <Button
              asChild
              className="h-11 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:ring-emerald-200"
            >
              <Link
                href={emptyState.ctaHref}
                data-cy="shop-chooser-empty-cta"
                onClick={() =>
                  handleTrack(
                    emptyState.analyticsEventName,
                    emptyState.analyticsPayload
                  )
                }
              >
                {emptyState.ctaLabel}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
