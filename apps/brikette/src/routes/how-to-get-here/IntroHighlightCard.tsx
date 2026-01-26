import clsx from "clsx";

import type { IntroHighlightCardProps } from "./types";

export function IntroHighlightCard({ eyebrow, children, className }: IntroHighlightCardProps) {
  return (
    <article className={clsx("rounded-2xl bg-brand-surface/90 p-6 text-brand-heading shadow-sm backdrop-blur-sm dark:bg-brand-surface/70 dark:text-brand-text", className)}>
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-heading/70 dark:text-brand-text/80">
        {eyebrow}
      </p>
      <div className="mt-3 text-base leading-relaxed">{children}</div>
    </article>
  );
}
