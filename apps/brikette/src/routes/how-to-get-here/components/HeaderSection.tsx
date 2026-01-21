import type { TFunction } from "i18next";

import { Grid } from "@acme/ui/atoms/Grid";

import { CfImage } from "@/components/images/CfImage";

import { getFilterButtonClass, HERO_IMAGE_SRC } from "../styles";
import type { HeaderContent } from "../types";

import { RoutePicker, type RoutePickerSelection } from "./RoutePicker";

export type HeaderSectionProps = {
  header: HeaderContent;
  heroImageAlt: string;
  t: TFunction<"howToGetHere">;
  places: Array<{ id: string; name: string }>;
  onRoutePick: (selection: RoutePickerSelection) => void;
  onOpenFilters: () => void;
};

export function HeaderSection({
  header,
  heroImageAlt,
  t,
  places,
  onRoutePick,
  onOpenFilters,
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
          <div className="mt-6 space-y-3">
            <RoutePicker t={t} places={places} onSubmit={onRoutePick} />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenFilters}
                className={getFilterButtonClass(false)}
              >
                {t("filters.editLabel", { defaultValue: "Edit filters" })}
              </button>
              <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
                {t("filters.shareHint", {
                  defaultValue: "Filters are reflected in the URL for easy sharing.",
                })}
              </p>
            </div>
          </div>
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
