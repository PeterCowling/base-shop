import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { TFunction } from "i18next";
import { ChevronRight } from "lucide-react";

import { resolveHref } from "../richText";
import { getFilterButtonClass } from "../styles";
import { TRANSPORT_MODE_ICONS, TRANSPORT_MODE_ORDER } from "../transport";
import type { AugmentedDestinationLink, RouteDirection, RouteFacts, TransportMode } from "../types";
import { Cluster, Inline } from "../ui";

type RouteVariant = AugmentedDestinationLink & {
  facts?: RouteFacts;
};

export type RouteCardGroupModel = {
  id: string;
  modes: TransportMode[];
  routes: Record<RouteDirection, RouteVariant[]>;
};

const EMPTY_ROUTES: RouteVariant[] = [];

const ROUTE_GROUP_CARD_CLASS = [
  "rounded-2xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-surface",
  "p-4",
  "shadow-sm",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/40",
].join(" ");

const ROUTE_GROUP_CARD_HIGHLIGHT_CLASS = [
  "ring-2",
  "ring-brand-primary",
  "ring-offset-2",
  "ring-offset-brand-surface",
  "dark:ring-brand-secondary",
  "dark:ring-offset-brand-surface/70",
].join(" ");

const ROUTE_VARIANT_LINK_CLASS = [
  "group",
  "inline-flex",
  "w-full",
  "items-center",
  "justify-between",
  "gap-3",
  "rounded-xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-primary/5",
  "px-4",
  "py-3",
  "text-start",
  "text-sm",
  "font-semibold",
  "text-brand-heading",
  "shadow-sm",
  "transition",
  "hover:border-brand-primary/40",
  "hover:bg-brand-primary/10",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:border-brand-outline/40",
  "dark:bg-brand-surface/30",
  "dark:text-brand-surface",
  "dark:hover:border-brand-secondary/50",
  "dark:hover:bg-brand-surface/40",
  "dark:focus-visible:outline-brand-secondary",
].join(" ");

const ROUTE_VARIANT_ACTIVE_CLASS = [
  "border-brand-primary/60",
  "dark:border-brand-secondary/60",
].join(" ");

function formatModesLabel(modes: TransportMode[], t: TFunction<"howToGetHere">): string {
  const ordered = [...modes].sort(
    (a, b) => TRANSPORT_MODE_ORDER.indexOf(a) - TRANSPORT_MODE_ORDER.indexOf(b),
  );
  return ordered.map((mode) => t(`filters.transportModes.${mode}`)).join(" + ");
}

function resolveSeasonality(facts: RouteFacts | undefined, modes: TransportMode[]): string | null {
  const explicit = facts?.seasonality?.trim();
  if (explicit) return explicit;
  if (modes.includes("ferry")) return "Seasonal";
  return "Year-round";
}

function resolveLuggageIndicator(facts: RouteFacts | undefined, modes: TransportMode[]): 1 | 2 | 3 | null {
  const explicit = facts?.luggageFriendly;
  if (explicit) return explicit;
  if (modes.includes("car")) return 3;
  if (modes.includes("train")) return 2;
  if (modes.includes("bus")) return 2;
  if (modes.includes("walk")) return 1;
  if (modes.includes("ferry")) return 1;
  return null;
}

function FactsPills({
  t,
  facts,
  modes,
}: {
  t: TFunction<"howToGetHere">;
  facts: RouteFacts | undefined;
  modes: TransportMode[];
}) {
  const pills = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    const duration = facts?.duration?.trim();
    const cost = facts?.cost?.trim();
    const walking = facts?.walking?.trim();
    const seasonality = resolveSeasonality(facts, modes);
    const luggage = resolveLuggageIndicator(facts, modes);

    if (duration) items.push({ label: t("routeCard.duration", { defaultValue: "Duration" }), value: duration });
    if (cost) items.push({ label: t("routeCard.cost", { defaultValue: "Cost" }), value: cost });
    if (walking) items.push({ label: t("routeCard.walking", { defaultValue: "Walking" }), value: walking });
    if (luggage) items.push({ label: t("routeCard.luggage", { defaultValue: "Luggage" }), value: `${luggage}/3` });
    if (seasonality) items.push({ label: t("routeCard.seasonality", { defaultValue: "Season" }), value: seasonality });

    return items.slice(0, 5);
  }, [facts, modes, t]);

  if (pills.length === 0) return null;

  return (
    <Cluster
      as="ul"
      className="mt-3"
      aria-label={t("routeCard.factsLabel", { defaultValue: "Route facts" })}
    >
      {pills.map((pill) => (
        <li key={`${pill.label}-${pill.value}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-outline/20 bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-heading shadow-sm dark:border-brand-outline/40 dark:bg-brand-surface/40 dark:text-brand-surface">
            <span className="tracking-eyebrow text-xs font-semibold uppercase text-brand-heading/70 dark:text-brand-surface/70">
              {pill.label}
            </span>
            <span className="whitespace-nowrap">{pill.value}</span>
          </span>
        </li>
      ))}
    </Cluster>
  );
}

export type RouteCardGroupProps = {
  group: RouteCardGroupModel;
  t: TFunction<"howToGetHere">;
  internalBasePath: string;
  highlightedRouteSlug?: string | null;
  preferredDirection?: RouteDirection | null;
};

function RouteCardGroupBase({
  group,
  t,
  internalBasePath,
  highlightedRouteSlug,
  preferredDirection,
}: RouteCardGroupProps) {
  const toRoutes = group.routes.to ?? EMPTY_ROUTES;
  const fromRoutes = group.routes.from ?? EMPTY_ROUTES;
  const hasTo = toRoutes.length > 0;
  const hasFrom = fromRoutes.length > 0;

  const defaultDirection: RouteDirection = useMemo(() => {
    if (highlightedRouteSlug) {
      if (toRoutes.some((route) => route.href === highlightedRouteSlug)) return "to";
      if (fromRoutes.some((route) => route.href === highlightedRouteSlug)) return "from";
    }
    if (preferredDirection && (preferredDirection === "to" || preferredDirection === "from")) {
      if (preferredDirection === "to" && hasTo) return "to";
      if (preferredDirection === "from" && hasFrom) return "from";
    }
    if (hasTo) return "to";
    return "from";
  }, [fromRoutes, hasFrom, hasTo, highlightedRouteSlug, preferredDirection, toRoutes]);

  const [direction, setDirection] = useState<RouteDirection>(defaultDirection);
  useEffect(() => {
    setDirection(defaultDirection);
  }, [defaultDirection]);

  const visibleRoutes = direction === "to" ? toRoutes : fromRoutes;
  const primary = visibleRoutes[0] ?? (hasTo ? toRoutes[0] : fromRoutes[0]);

  const title = formatModesLabel(group.modes, t);
  const summary = primary?.summary?.trim() || primary?.label || "";
  const isHighlighted =
    Boolean(highlightedRouteSlug) &&
    (toRoutes.some((route) => route.href === highlightedRouteSlug) ||
      fromRoutes.some((route) => route.href === highlightedRouteSlug));

  return (
    <article
      className={clsx(ROUTE_GROUP_CARD_CLASS, isHighlighted ? ROUTE_GROUP_CARD_HIGHLIGHT_CLASS : null)}
    >
      {/* Anchors used by the route picker scroll target */}
      {toRoutes.map((route) => (
        <span key={`anchor-${route.href}`} id={`route-${route.href}`} />
      ))}
      {fromRoutes.map((route) => (
        <span key={`anchor-${route.href}`} id={`route-${route.href}`} />
      ))}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
              {title}
            </h3>
            <Inline as="span" className="gap-1" aria-hidden>
              {group.modes.map((mode) => {
                const Icon = TRANSPORT_MODE_ICONS[mode];
                return Icon ? <Icon key={mode} className="size-4 text-brand-primary dark:text-brand-secondary" /> : null;
              })}
            </Inline>
          </div>
          {summary ? (
            <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/80">{summary}</p>
          ) : null}

          <FactsPills t={t} facts={primary?.facts} modes={group.modes} />
        </div>

        {hasTo && hasFrom ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirection("to")}
              className={getFilterButtonClass(direction === "to")}
              aria-pressed={direction === "to"}
            >
              {t("routeCard.direction.to", { defaultValue: "To hostel" })}
            </button>
            <button
              type="button"
              onClick={() => setDirection("from")}
              className={getFilterButtonClass(direction === "from")}
              aria-pressed={direction === "from"}
            >
              {t("routeCard.direction.from", { defaultValue: "From hostel" })}
            </button>
          </div>
        ) : null}
      </header>

      <div className="mt-4 space-y-2">
        {visibleRoutes.map((route) => {
          const href = resolveHref(route, internalBasePath);
          const label = route.label || t("routeCard.cta", { defaultValue: "View step-by-step" });
          const isActive = highlightedRouteSlug && route.href === highlightedRouteSlug;
          const classes = clsx(ROUTE_VARIANT_LINK_CLASS, isActive ? ROUTE_VARIANT_ACTIVE_CLASS : null);

          return route.internal ? (
            <Link key={href} to={href} prefetch="intent" className={classes}>
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
                {route.facts?.duration || route.facts?.cost ? (
                  <span className="mt-0.5 block truncate text-xs font-medium text-brand-text/70 dark:text-brand-surface/70">
                    {[route.facts?.duration, route.facts?.cost].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </span>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition group-hover:bg-brand-primary/15 dark:bg-brand-secondary/20 dark:text-brand-secondary">
                <ChevronRight aria-hidden className="size-4" />
              </span>
            </Link>
          ) : (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={classes}>
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
              </span>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary transition group-hover:bg-brand-primary/15 dark:bg-brand-secondary/20 dark:text-brand-secondary">
                <ChevronRight aria-hidden className="size-4" />
              </span>
            </a>
          );
        })}
      </div>
    </article>
  );
}

export const RouteCardGroup = memo(RouteCardGroupBase);
