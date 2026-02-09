import type { TFunction } from "i18next";

import { CfImage } from "@acme/ui/atoms/CfImage";

import { HERO_IMAGE_SRC } from "../styles";
import type { HeaderContent } from "../types";

import { RoutePicker, type RoutePickerSelection } from "./RoutePicker";

export type HeaderSectionProps = {
  header: HeaderContent;
  heroImageAlt: string;
  t: TFunction<"howToGetHere">;
  places: Array<{ id: string; name: string }>;
  onRoutePick: (selection: RoutePickerSelection) => void;
};

export function HeaderSection({
  header,
  heroImageAlt,
  t,
  places,
  onRoutePick,
}: HeaderSectionProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-primary/10 via-brand-outline/10 to-brand-surface p-8 shadow-lg dark:border-brand-outline/30 dark:from-brand-secondary/10 dark:via-brand-surface/40 dark:to-brand-surface/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 size-72 -translate-y-1/2 rounded-full bg-brand-primary/20 blur-3xl dark:bg-brand-secondary/25"
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 relative items-start">
        <div>
          <span className="tracking-eyebrow rounded-full border border-brand-outline/10 bg-brand-surface/70 px-3 py-1 text-xs font-semibold uppercase text-brand-primary shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/50 dark:text-brand-text/80">
            {header.eyebrow}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-heading dark:text-brand-text">
            {header.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-text/90 dark:text-brand-text/90">
            {header.description}
          </p>
          <div className="mt-6">
            <RoutePicker t={t} places={places} onSubmit={onRoutePick} />
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
      </div>

    </header>
  );
}
