"use client";

import Link from "next/link";
import type { ConfiguratorHeroData } from "../hooks/useConfiguratorDashboardState";
import { ButtonElement, ProgressBar } from "./DashboardPrimitives";

type ConfiguratorHeroProps = ConfiguratorHeroData;

export function ConfiguratorHero({
  description,
  progressPercent,
  essentialProgressLabel,
  resumeCta,
  quickStats,
}: ConfiguratorHeroProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-foreground/70">
          Shop Configurator
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">
          Build a launch-ready storefront without the guesswork
        </h1>
        <p className="text-primary-foreground/80">{description}</p>
      </div>
      <div className="space-y-4">
        <ProgressBar value={progressPercent} label={essentialProgressLabel} />
        <div className="flex flex-wrap gap-3">
          <ButtonElement
            asChild
            className="h-11 px-5 text-sm font-semibold"
            variant={resumeCta.isPrimary ? "default" : "outline"}
          >
            <Link href={resumeCta.href} onClick={resumeCta.onClick}>
              {resumeCta.label}
            </Link>
          </ButtonElement>
          <ButtonElement
            asChild
            variant="outline"
            className="h-11 px-5 text-sm font-semibold border-primary/40 text-primary-foreground hover:bg-primary/10"
          >
            <Link href="#configurator-steps" scroll={true}>
              Browse all steps
            </Link>
          </ButtonElement>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-primary/15 bg-surface-2 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
              {stat.label}
            </p>
            <p className="text-xl font-semibold">{stat.value}</p>
            <p className="text-xs text-primary-foreground/70">{stat.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConfiguratorHero;
