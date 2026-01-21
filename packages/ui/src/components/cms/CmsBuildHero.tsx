// packages/ui/src/components/cms/CmsBuildHero.tsx

import type { ReactNode } from "react";

import { Button } from "../../components/atoms";
import { Grid, Inline } from "../../components/atoms/primitives";
import { cn } from "../../utils/style";

export type CmsBuildHeroTone = "build" | "operate" | "upgrade";

export interface CmsBuildHeroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CmsBuildHeroMetaItem {
  id: string;
  label: string;
  value: string;
  caption?: string;
}

export interface CmsBuildHeroProps {
  tag?: string;
  title: string;
  body?: string;
  primaryCta?: CmsBuildHeroCta;
  secondaryCtas?: CmsBuildHeroCta[];
  inlineMeta?: CmsBuildHeroMetaItem[];
  tone?: CmsBuildHeroTone;
  className?: string;
  tagIcon?: ReactNode;
}

export function CmsBuildHero({
  tag,
  title,
  body,
  primaryCta,
  secondaryCtas,
  inlineMeta,
  tone = "build",
  className,
  tagIcon,
}: CmsBuildHeroProps) {
  const heroToneClass =
    tone === "upgrade"
      ? "bg-hero-contrast/95"
      : tone === "operate"
        ? "bg-hero-contrast"
        : "bg-hero-contrast";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        {tag ? (
          <span className="text-xs font-semibold uppercase tracking-widest text-hero-foreground/80">
            {tagIcon ? <span aria-hidden>{tagIcon}</span> : null}
            {tag}
          </span>
        ) : null}
        <h1 className="text-3xl font-semibold md:text-4xl">
          {title}
        </h1>
        {body ? (
          <p className="text-sm text-hero-foreground/80">
            {body}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">
        {(primaryCta || (secondaryCtas && secondaryCtas.length > 0)) && (
          <Inline gap={3} wrap alignY="center">
            {primaryCta && (
              <Button
                className={cn(
                  "h-11 px-5 text-sm font-semibold", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
                  heroToneClass,
                  "text-hero-foreground shadow-elevation-2 hover:bg-primary/10", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
                )}
                onClick={primaryCta.onClick}
                asChild={Boolean(primaryCta.href)}
              >
                {primaryCta.href ? (
                  <a href={primaryCta.href}>{primaryCta.label}</a>
                ) : (
                  <span>{primaryCta.label}</span>
                )}
              </Button>
            )}
            {secondaryCtas?.map((cta) => (
              <Button
                key={cta.label}
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                onClick={cta.onClick}
                asChild={Boolean(cta.href)}
              >
                {cta.href ? (
                  <a href={cta.href}>{cta.label}</a>
                ) : (
                  <span>{cta.label}</span>
                )}
              </Button>
            ))}
          </Inline>
        )}
      </div>
      {inlineMeta && inlineMeta.length > 0 && (
        <Grid cols={1} gap={3} className="sm:grid-cols-3">
          {inlineMeta.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-primary/15 bg-surface-2 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-xl font-semibold text-foreground">
                {item.value}
              </p>
              {item.caption ? (
                <p className="text-xs text-muted-foreground">
                  {item.caption}
                </p>
              ) : null}
            </div>
          ))}
        </Grid>
      )}
    </div>
  );
}

export default CmsBuildHero;
