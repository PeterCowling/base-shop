import type { TFunction } from "i18next";

import { Button } from "@acme/design-system/primitives";

import { TRANSPORT_MODE_ORDER } from "../transport";
import type { AugmentedDestinationSection, RouteDirection, TransportMode } from "../types";
import { Cluster } from "../ui";

import { RouteCardGroup, type RouteCardGroupModel } from "./RouteCardGroup";
import { ZoomableFigure } from "./ZoomableFigure";

export type DestinationSectionsProps = {
  sections: AugmentedDestinationSection[];
  showEmptyState: boolean;
  t: TFunction<"howToGetHere">;
  internalBasePath: string;
  highlightedRouteSlug?: string | null;
  preferredDirection?: RouteDirection | null;
  onOpenFilters?: () => void;
  onClearFilters?: () => void;
  suggestedFixes?: Array<{ label: string; onClick: () => void }>;
};

export function DestinationSections({
  sections,
  showEmptyState,
  t,
  internalBasePath,
  highlightedRouteSlug,
  preferredDirection,
  onOpenFilters,
  onClearFilters,
  suggestedFixes,
}: DestinationSectionsProps) {
  if (showEmptyState) {
    return (
      <div className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60">
        <p className="text-base font-semibold text-brand-heading dark:text-brand-text">
          {t("filters.noResults")}
        </p>
        <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-text/70">
          {t("filters.noResultsHint", {
            defaultValue: "Try removing a filter, or view the closest alternatives.",
          })}
        </p>

        <Cluster as="div" className="mt-4 items-center gap-2">
          {onOpenFilters ? (
            <Button type="button" onClick={onOpenFilters} color="primary" tone="solid" size="sm" className="rounded-xl">
              {t("filters.editLabel", { defaultValue: "Edit filters" })}
            </Button>
          ) : null}
          {onClearFilters ? (
            <Button type="button" onClick={onClearFilters} color="default" tone="outline" size="sm" className="rounded-xl">
              {t("filters.clearLabel")}
            </Button>
          ) : null}
        </Cluster>

        {suggestedFixes && suggestedFixes.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-heading/70 dark:text-brand-text/70">
              {t("filters.suggestionsLabel", { defaultValue: "Suggested fixes" })}
            </p>
            <Cluster as="ul" className="mt-2 list-none p-0">
              {suggestedFixes.map((fix) => (
                <li key={fix.label}>
                  <Button type="button" onClick={fix.onClick} color="default" tone="outline" size="sm" className="rounded-full">
                    {fix.label}
                  </Button>
                </li>
              ))}
            </Cluster>
          </div>
        ) : null}
      </div>
    );
  }

  const normalizeEndpoint = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.replace(/-with-luggage$/, "").replace(/-directions-by-ferry$/, "");
  };

  const normalizeModes = (modes: TransportMode[]): TransportMode[] => {
    const unique = Array.from(new Set(modes)).filter((mode): mode is TransportMode =>
      TRANSPORT_MODE_ORDER.includes(mode),
    );
    unique.sort((a, b) => TRANSPORT_MODE_ORDER.indexOf(a) - TRANSPORT_MODE_ORDER.indexOf(b));
    return unique;
  };

  const signatureForModes = (modes: TransportMode[]): string => normalizeModes(modes).join("+");

  const groupKeyForLink = (sectionId: string, href: string, modesSignature: string): string => {
    if (href.includes("-to-")) {
      const marker = "-to-";
      const index = href.indexOf(marker);
      if (index > 0) {
        const left = normalizeEndpoint(href.slice(0, index));
        const right = normalizeEndpoint(href.slice(index + marker.length));
        const endpoints = [left, right].filter(Boolean).sort();
        if (endpoints.length >= 2) {
          return `${endpoints.join("|")}::${modesSignature}`;
        }
      }
    }
    return `${sectionId}::${modesSignature}`;
  };

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const groups = new Map<string, RouteCardGroupModel & { __sortIndex: number }>();

        section.links.forEach((link, index) => {
          const modes = normalizeModes(link.transportModes.length ? link.transportModes : ["bus"]);
          const signature = signatureForModes(modes);
          const groupKey = link.groupKey?.trim() || groupKeyForLink(section.id, link.href, signature);
          const existing = groups.get(groupKey);
          const base: RouteCardGroupModel & { __sortIndex: number } =
            existing ??
            ({
              id: groupKey.replace(/[^a-zA-Z0-9_-]+/g, "-"),
              modes,
              routes: { to: [], from: [] },
              __sortIndex: index,
            } satisfies RouteCardGroupModel & { __sortIndex: number });

          base.modes = normalizeModes(base.modes);
          base.routes[link.direction].push(link);
          groups.set(groupKey, base);
        });

        const orderedGroups = Array.from(groups.values())
          .sort((a, b) => a.__sortIndex - b.__sortIndex)
          .map(({ __sortIndex: _ignore, ...group }) => group);

        return (
          <article
            id={section.id}
            key={section.id}
            className="scroll-mt-28 rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60"
          >
            <div
              className={`grid grid-cols-1 gap-5 md:items-start ${
                section.image ? "md:grid-cols-2" : "md:grid-cols-1"
              }`}
            >
              <div>
                <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">{section.name}</h2>
                {section.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-brand-text/80 dark:text-brand-text/70">
                    {section.description}
                  </p>
                ) : null}

                <div className="mt-6 space-y-4">
                  {orderedGroups.map((group) => (
                    <RouteCardGroup
                      key={group.id}
                      group={group}
                      t={t}
                      internalBasePath={internalBasePath}
                      highlightedRouteSlug={highlightedRouteSlug ?? null}
                      preferredDirection={preferredDirection ?? null}
                    />
                  ))}
                </div>
              </div>

              {section.image ? (
                <ZoomableFigure
                  t={t}
                  src={section.image.src}
                  alt={section.image.alt}
                  {...(typeof section.image.caption === "string" ? { caption: section.image.caption } : {})}
                  preset="gallery"
                  aspect="4/3"
                />
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
