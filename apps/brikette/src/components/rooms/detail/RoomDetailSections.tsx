import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import type { TFunction } from "i18next";

import { DirectBookingPerks } from "@acme/ui/molecules";

import LocationInline from "@/components/booking/LocationInline";
import FacilityIcon from "@/components/rooms/FacilityIcon";
import type { RoomFeatures } from "@/data/roomsData";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

export type HeroContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
};

export type OutlineContent = {
  heading?: string;
  items?: { title?: string; body?: string }[];
};

export type AmenityContent = { title?: string; body?: string };

type GridAsDivProps = ComponentPropsWithoutRef<"div"> & { as?: "div" };
type GridAsUlProps = ComponentPropsWithoutRef<"ul"> & { as: "ul" };
type GridProps = GridAsDivProps | GridAsUlProps;

function Grid(props: GridProps) {
  if (props.as === "ul") {
    const { as: _ignore, ...rest } = props;
    return <ul {...rest} />;
  }
  const { as: _ignore, ...rest } = props;
  return <div {...rest} />;
}

export const Section = ({ children, ...rest }: ComponentProps<"section">) => (
  <section {...rest}>{children}</section>
);

export function resolveCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  if (/^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/u.test(trimmed)) return fallback;
  if (/^[A-Z0-9_]+(?:\.[A-Z0-9_]+)+$/u.test(trimmed)) return fallback;
  return trimmed;
}

export function coerceToContent<T>(raw: unknown): T | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as T) : null;
}

export function resolveAmenitiesSection(
  amenityRaw: unknown,
  heading: string,
  intro: string,
): { blurbs: AmenityContent[]; shouldRender: boolean } {
  const isArray = Array.isArray(amenityRaw);
  const blurbs = isArray ? (amenityRaw as AmenityContent[]) : [];
  const hasFallback = !isArray && Boolean(amenityRaw) && Boolean(heading || intro);
  return { blurbs, shouldRender: blurbs.length > 0 || hasFallback };
}

export function HeroSection({ hero }: { hero: HeroContent | null }) {
  if (!hero || !(hero.eyebrow || hero.title || hero.subtitle || hero.bullets?.length)) {
    return null;
  }

  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4 text-brand-heading dark:text-brand-surface">
      {hero.eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary dark:text-brand-secondary">
          {hero.eyebrow}
        </p>
      ) : null}
      {hero.title ? (
        <p className="mt-3 text-3xl font-extrabold text-brand-primary dark:text-brand-secondary">
          {hero.title}
        </p>
      ) : null}
      {hero.subtitle ? (
        <p className="mt-2 text-lg text-brand-text dark:text-brand-surface/90">{hero.subtitle}</p>
      ) : null}
      {hero.bullets?.length ? (
        <Grid as="ul" className="mt-5 grid gap-3 sm:grid-cols-2">
          {hero.bullets.map((bullet, idx) => (
            <li
              key={`${bullet}-${idx}`}
              className="rounded-lg border border-brand-surface/60 bg-brand-bg/80 p-4 text-sm font-medium text-brand-text shadow-sm backdrop-blur dark:border-brand-surface/20 dark:bg-brand-surface dark:text-brand-text"
            >
              {bullet}
            </li>
          ))}
        </Grid>
      ) : null}
    </Section>
  );
}

export function FeatureSection({
  features,
  bedsLabel,
  bathroomLabel,
  viewLabel,
  terraceLabel,
  lockersLabel,
  privateTerraceLabel,
  inRoomLockersLabel,
}: {
  features: RoomFeatures | undefined;
  bedsLabel: string;
  bathroomLabel: string;
  viewLabel: string;
  terraceLabel: string;
  lockersLabel: string;
  privateTerraceLabel: string;
  inRoomLockersLabel: string;
}) {
  if (!features) return null;

  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4">
      <dl className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
          <dt className="w-28 shrink-0 font-medium">{bedsLabel}</dt>
          <dd>{features.bedSpec}</dd>
        </div>
        <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
          <dt className="w-28 shrink-0 font-medium">{bathroomLabel}</dt>
          <dd>{features.bathroomSpec}</dd>
        </div>
        {features.viewSpec ? (
          <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">{viewLabel}</dt>
            <dd>{features.viewSpec}</dd>
          </div>
        ) : null}
        {features.terracePresent ? (
          <div className="flex items-center gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">{terraceLabel}</dt>
            <dd>{privateTerraceLabel}</dd>
          </div>
        ) : null}
        {features.inRoomLockers ? (
          <div className="flex items-center gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">{lockersLabel}</dt>
            <dd className="flex items-center gap-1">
              <FacilityIcon facility="locker" />
              {inRoomLockersLabel}
            </dd>
          </div>
        ) : null}
      </dl>
    </Section>
  );
}

export function OutlineSection({ outline }: { outline: OutlineContent | null }) {
  if (!outline || !(outline.heading || outline.items?.length)) {
    return null;
  }

  return (
    <Section className="mx-auto mt-8 max-w-3xl px-4">
      {outline.heading ? (
        <h2 className="text-lg font-semibold text-brand-heading dark:text-brand-surface">
          {outline.heading}
        </h2>
      ) : null}
      <div className="mt-4 space-y-4">
        {outline.items?.map((item, idx) => (
          <article
            key={`${item.title ?? "outline"}-${idx}`}
            className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-surface"
          >
            {item.title ? (
              <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                {item.title}
              </h3>
            ) : null}
            {item.body ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-text/80">
                {item.body}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}

export function AmenitiesSection({
  shouldRender,
  heading,
  intro,
  blurbs,
}: {
  shouldRender: boolean;
  heading: string;
  intro: string;
  blurbs: AmenityContent[];
}) {
  if (!shouldRender) {
    return null;
  }

  return (
    <Section className="mx-auto mt-8 max-w-3xl px-4">
      {heading ? (
        <h2 className="text-lg font-semibold text-brand-heading dark:text-brand-surface">
          {heading}
        </h2>
      ) : null}
      {intro ? (
        <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-surface/80">{intro}</p>
      ) : null}
      {blurbs.length ? (
        <Grid className="mt-4 grid gap-4 md:grid-cols-2">
          {blurbs.map((item, idx) => (
            <div
              key={`${item.title ?? "amenity"}-${idx}`}
              className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-surface"
            >
              {item.title ? (
                <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                  {item.title}
                </h3>
              ) : null}
              {item.body ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-text/80">
                  {item.body}
                </p>
              ) : null}
            </div>
          ))}
        </Grid>
      ) : null}
    </Section>
  );
}

export function RoomDetailGuidesSection({
  lang,
  tGuides,
  guidesEnT,
}: {
  lang: AppLanguage;
  tGuides: TFunction;
  guidesEnT: TFunction;
}) {
  return (
    <Section className="mx-auto mt-8 max-w-3xl px-4">
      <h2 className="mb-3 text-lg font-semibold text-brand-heading dark:text-brand-surface">
        {tGuides("labels.helpfulGuides")}
      </h2>
      <Grid as="ul" className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href={guideHref(lang, "reachBudget")}
            prefetch={true}
            className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:border-brand-secondary/35 dark:bg-brand-surface dark:text-brand-text dark:hover:text-brand-secondary"
          >
            {getGuideLinkLabel(tGuides, guidesEnT, "reachBudget")}
          </Link>
        </li>
      </Grid>
    </Section>
  );
}

export function RoomDetailDescription({
  description,
  lang,
}: {
  description: string;
  lang: AppLanguage;
}) {
  return (
    <Section className="mx-auto max-w-3xl px-4">
      <p className="mt-6 text-base leading-relaxed">{description}</p>
      <div className="mt-4">
        <DirectBookingPerks lang={lang} />
        <LocationInline lang={lang} />
      </div>
    </Section>
  );
}
