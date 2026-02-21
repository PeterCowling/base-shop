"use client";

// eslint-disable-next-line no-restricted-imports -- TASK-30: CfImage not yet exported from design-system/primitives
import { CfImage } from "@acme/ui/atoms/CfImage";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  scrollNudge?: string;
};

export function ExperiencesHero({
  eyebrow,
  title,
  subtitle,
  scrollNudge,
}: Props): JSX.Element {
  return (
    // eslint-disable-next-line ds/container-widths-only-at -- TASK-30: Hero wrapper max-width pre-existing pattern
    <div className="mx-auto w-full max-w-6xl">
      {/* Main hero: stacked on mobile with 12px gap, split (image left, text right) on sm+ */}
      <div className="grid grid-cols-1 gap-3 rounded-3xl border border-brand-outline/30 bg-brand-surface shadow-xl dark:border-brand-outline/50 dark:bg-brand-bg sm:grid-cols-2 sm:gap-0">
        {/* Image section - banner on mobile, left column on sm+ */}
        <div
          // eslint-disable-next-line ds/no-arbitrary-tailwind -- TASK-DS-26: 16/9 aspect ratio and 320px min height are specific design requirements
          className="aspect-[16/9] overflow-hidden rounded-t-3xl sm:aspect-auto sm:min-h-[320px] sm:rounded-l-3xl sm:rounded-tr-none"
        >
          <CfImage
            // eslint-disable-next-line ds/no-hardcoded-copy -- TASK-30: image path not user-facing copy
            src="/img/hostel-communal-terrace-lush-view.webp"
            preset="hero"
            alt=""
            className="size-full object-cover"
            width={1600}
            height={900}
            data-aspect="16/9"
            priority
          />
        </div>

        {/* Content section - right column on sm+, isolated from image */}
        {/* eslint-disable-next-line ds/no-nonlayered-zindex -- TASK-30: z-10 ensures text overlays image on mobile */}
        <div className="relative z-10 bg-brand-surface p-6 dark:bg-brand-bg sm:flex sm:flex-col sm:justify-center sm:p-8">
          {eyebrow ? (
            <p
              // eslint-disable-next-line ds/no-arbitrary-tailwind, ds/no-raw-typography -- TASK-DS-26: Wide letter-spacing (0.25em) is a design requirement for eyebrow text
              className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted dark:text-brand-muted"
            >
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-heading dark:text-brand-heading sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            // eslint-disable-next-line ds/container-widths-only-at -- TASK-30: max-w-xl constrains text width for readability
            <p className="mt-4 max-w-xl text-lg text-brand-paragraph dark:text-brand-paragraph">
              {subtitle}
            </p>
          ) : null}

          {scrollNudge ? (
            <a
              href="#guides"
              className="mt-8 inline-flex min-h-11 min-w-11 items-center gap-2 text-sm font-medium text-brand-primary transition hover:text-brand-primary/80 dark:text-brand-secondary dark:hover:text-brand-secondary/80"
            >
              <span>{scrollNudge}</span>
              <svg
                className="size-4 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ExperiencesHero;
