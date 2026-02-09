"use client";

import { CfImage } from "@acme/ui/atoms/CfImage";

import { Check } from "@/icons";

import type { ExperienceFeatureCopy, ExperienceFeatureKey } from "./experiencesPageCopy";

export function ExperienceFeatureSection({
  id,
  copy,
  imageSrc,
  imagePosition = "left",
}: {
  id: ExperienceFeatureKey;
  copy: ExperienceFeatureCopy;
  imageSrc: string;
  imagePosition?: "left" | "right";
}): JSX.Element | null {
  const title = copy.title?.trim() ?? "";
  const description = copy.description?.trim() ?? "";
  const highlights = copy.highlights ?? [];
  const headingId = `${id}-heading`;

  if (!title && !description && highlights.length === 0) return null;

  const media = (
    <div className="relative overflow-hidden rounded-3xl border border-brand-outline/30 bg-brand-surface shadow-sm dark:border-brand-outline/40 dark:bg-brand-text/10">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-primary/20" />
      <CfImage
        src={imageSrc}
        preset="gallery"
        alt={copy.imageAlt?.trim() ?? ""}
        // eslint-disable-next-line ds/no-arbitrary-tailwind -- TASK-DS-26: 4/3 aspect ratio is a specific design requirement
        className="relative aspect-[4/3] w-full object-cover"
        width={1200}
        height={900}
        data-aspect="4/3"
      />
    </div>
  );

  const body = (
    <div className="space-y-4">
      {copy.eyebrow?.trim() ? (
        <p
          // eslint-disable-next-line ds/no-arbitrary-tailwind -- TASK-DS-26: Wide letter-spacing (0.25em) is a design requirement for eyebrow text
          className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-muted"
        >
          {copy.eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2
          id={headingId}
          className="text-2xl font-semibold text-brand-heading dark:text-brand-heading sm:text-3xl"
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="text-base text-brand-paragraph dark:text-brand-paragraph">{description}</p>
      ) : null}
      {highlights.length ? (
        <ul className="space-y-3 text-sm text-brand-text/80 dark:text-brand-text">
          {highlights.map((item, index) => (
            <li key={`${id}-highlight-${index}`} className="flex gap-3">
              <span className="mt-0.5 inline-flex size-5 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-secondary/15 dark:text-brand-secondary">
                <Check className="size-4" aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const isImageLeft = imagePosition === "left";
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 grid gap-10 lg:grid-cols-2 lg:items-center"
    >
      <div className={isImageLeft ? "lg:order-1" : "lg:order-2"}>{media}</div>
      <div className={isImageLeft ? "lg:order-2" : "lg:order-1"}>{body}</div>
    </section>
  );
}

export default ExperienceFeatureSection;
