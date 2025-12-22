import type { TFunction } from "i18next";

import { Grid } from "@acme/ui/atoms/Grid";
import { CfImage } from "@acme/ui/atoms/CfImage";

import { clearFiltersButtonClass, getFilterButtonClass, HERO_IMAGE_SRC } from "../styles";
import { TRANSPORT_MODE_ICONS } from "../transport";
import { Cluster, Inline, Stack } from "../ui";
import type { HeaderContent } from "../types";
import type { DestinationFiltersState } from "../useDestinationFilters";

export type ActiveFilter = { label: string; value: string };

type FiltersState = Pick<
  DestinationFiltersState,
  | "transportFilter"
  | "directionFilter"
  | "destinationFilter"
  | "setTransportFilter"
  | "setDirectionFilter"
  | "setDestinationFilter"
  | "availableTransportModes"
  | "availableDirections"
  | "availableDestinations"
  | "hasActiveFilters"
  | "clearFilters"
>;

export type HeaderSectionProps = {
  header: HeaderContent;
  stats: ReadonlyArray<{ label: string; value: number; href?: string }>;
  heroImageAlt: string;
  t: TFunction<"howToGetHere">;
  destinationFilterLabel: string;
  destinationFilterAllLabel: string;
  filtersHelper: string;
  activeFiltersLabel: string;
  activeFilters: ActiveFilter[];
  filters: FiltersState;
};

export function HeaderSection({
  header,
  stats,
  heroImageAlt,
  t,
  destinationFilterLabel,
  destinationFilterAllLabel,
  filtersHelper,
  activeFiltersLabel,
  activeFilters,
  filters,
}: HeaderSectionProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-primary/10 via-brand-outline/10 to-brand-surface p-8 shadow-lg dark:border-brand-outline/30 dark:from-brand-secondary/10 dark:via-brand-surface/40 dark:to-brand-surface/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 size-72 -translate-y-1/2 rounded-full bg-brand-primary/20 blur-3xl dark:bg-brand-secondary/25"
      />
      <Grid columns={{ base: 1, lg: 2 }} gap={10} className="relative items-start">
        <div>
          <span className="tracking-eyebrow rounded-full border border-brand-outline/10 bg-brand-surface/70 px-3 py-1 text-xs font-semibold uppercase text-brand-secondary shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/50 dark:text-brand-surface/80">
            {header.eyebrow}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-heading dark:text-brand-surface">
            {header.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-text/90 dark:text-brand-surface/90">
            {header.description}
          </p>
          <Grid as="dl" gap={4} columns={{ base: 1, sm: 3 }} className="mt-6 text-sm">
            {stats.map(({ label, value, href }) => (
              <div
                key={label}
                className="rounded-2xl border border-brand-outline/10 bg-brand-surface/80 p-4 text-brand-heading shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/60 dark:text-brand-surface"
              >
                <dt className="tracking-eyebrow text-xs font-semibold uppercase text-brand-heading/70 dark:text-brand-surface/70">
                  {label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold">
                  {href ? (
                    <Inline
                      as="a"
                      href={href}
                      className="min-h-10 min-w-10 justify-center rounded-lg px-3 outline-none transition hover:text-brand-primary focus-visible:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                    >
                      {value}
                    </Inline>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </Grid>
          <section
            aria-label={t("filters.title")}
            className="mt-6 rounded-2xl border border-brand-outline/10 bg-brand-surface/85 p-5 shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/60"
          >
            <FiltersPanel
              t={t}
              destinationFilterLabel={destinationFilterLabel}
              destinationFilterAllLabel={destinationFilterAllLabel}
              filtersHelper={filtersHelper}
              activeFiltersLabel={activeFiltersLabel}
              activeFilters={activeFilters}
              filters={filters}
            />
          </section>
        </div>
        <figure className="relative overflow-hidden rounded-3xl border border-brand-outline/10 bg-brand-surface/70 p-2 shadow-md backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/60">
          <CfImage
            src={HERO_IMAGE_SRC}
            alt={heroImageAlt}
            preset="hero"
            className="size-full rounded-2xl object-cover"
            data-aspect="4/3"
            priority
          />
        </figure>
      </Grid>

    </header>
  );
}

type FiltersPanelProps = {
  t: TFunction<"howToGetHere">;
  destinationFilterLabel: string;
  destinationFilterAllLabel: string;
  filtersHelper: string;
  activeFiltersLabel: string;
  activeFilters: ActiveFilter[];
  filters: FiltersState;
};

function FiltersPanel({
  t,
  destinationFilterLabel,
  destinationFilterAllLabel,
  filtersHelper,
  activeFiltersLabel,
  activeFilters,
  filters,
}: FiltersPanelProps) {
  const {
    transportFilter,
    directionFilter,
    destinationFilter,
    setTransportFilter,
    setDirectionFilter,
    setDestinationFilter,
    availableTransportModes,
    availableDirections,
    availableDestinations,
    hasActiveFilters,
    clearFilters,
  } = filters;

  return (
    <Stack className="gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
          {t("filters.title")}
        </h2>
        {filtersHelper ? (
          <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-surface/70">{filtersHelper}</p>
        ) : null}
      </div>
      <Stack className="gap-6">
        <fieldset className="min-w-0">
          <legend className="tracking-eyebrow text-sm font-semibold uppercase text-brand-secondary">
            {destinationFilterLabel}
          </legend>
          <Cluster as="ul" className="mt-3">
            <li>
              <button
                type="button"
                className={getFilterButtonClass(destinationFilter === "all")}
                onClick={() => setDestinationFilter("all")}
                aria-pressed={destinationFilter === "all"}
              >
                {destinationFilterAllLabel}
              </button>
            </li>
            {availableDestinations.map(({ id, name }) => {
              const isActive = destinationFilter === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={getFilterButtonClass(isActive)}
                    onClick={() => setDestinationFilter(isActive ? "all" : id)}
                    aria-pressed={isActive}
                  >
                    {name}
                  </button>
                </li>
              );
            })}
          </Cluster>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="tracking-eyebrow mt-6 text-sm font-semibold uppercase text-brand-secondary">
            {t("filters.transportLabel")}
          </legend>
          <Cluster as="ul" className="mt-3">
            <li>
              <button
                type="button"
                className={getFilterButtonClass(transportFilter === "all")}
                onClick={() => setTransportFilter("all")}
                aria-pressed={transportFilter === "all"}
              >
                {t("filters.transportAll")}
              </button>
            </li>
            {availableTransportModes.map((mode) => {
              const isActive = transportFilter === mode;
              const Icon = TRANSPORT_MODE_ICONS[mode];
              return (
                <li key={mode}>
                  <button
                    type="button"
                    className={getFilterButtonClass(isActive)}
                    onClick={() => setTransportFilter(isActive ? "all" : mode)}
                    aria-pressed={isActive}
                  >
                    {Icon ? <Icon aria-hidden className="size-4" /> : null}
                    <span>{t(`filters.transportModes.${mode}`)}</span>
                  </button>
                </li>
              );
            })}
          </Cluster>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="tracking-eyebrow mt-6 text-sm font-semibold uppercase text-brand-secondary">
            {t("filters.directionLabel")}
          </legend>
          <Cluster as="ul" className="mt-3">
            <li>
              <button
                type="button"
                className={getFilterButtonClass(directionFilter === "all")}
                onClick={() => setDirectionFilter("all")}
                aria-pressed={directionFilter === "all"}
              >
                {t("filters.directionAll")}
              </button>
            </li>
            {availableDirections.map((direction) => {
              const isActive = directionFilter === direction;
              return (
                <li key={direction}>
                  <button
                    type="button"
                    className={getFilterButtonClass(isActive)}
                    onClick={() => setDirectionFilter(isActive ? "all" : direction)}
                    aria-pressed={isActive}
                  >
                    {direction === "to" ? t("filters.directionTo") : t("filters.directionFrom")}
                  </button>
                </li>
              );
            })}
          </Cluster>
        </fieldset>
      </Stack>
      {hasActiveFilters ? (
        <Stack className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tracking-eyebrow text-xs font-semibold uppercase text-brand-heading/70 dark:text-brand-surface/70">
              {activeFiltersLabel}
            </p>
            <Cluster className="mt-2">
              {activeFilters.map(({ label, value }) => (
                <Inline
                  as="span"
                  key={`${label}-${value}`}
                  className="gap-2 rounded-full border border-brand-outline/20 bg-brand-outline/10 px-3 py-2 text-sm font-medium text-brand-heading dark:border-brand-outline/40 dark:bg-brand-surface/40 dark:text-brand-surface"
                >
                  <span className="tracking-eyebrow text-xs uppercase text-brand-heading/70 dark:text-brand-surface/70">
                    {label}
                  </span>
                  <span>{value}</span>
                </Inline>
              ))}
            </Cluster>
          </div>
          <button type="button" className={clearFiltersButtonClass} onClick={clearFilters}>
            {t("filters.clearLabel")}
          </button>
        </Stack>
      ) : null}
    </Stack>
  );
}
