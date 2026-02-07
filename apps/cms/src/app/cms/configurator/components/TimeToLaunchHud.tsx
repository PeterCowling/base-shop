"use client";

import { Inline } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";

import type { TimeToLaunchData } from "../hooks/dashboard/types";

import {
  CardRoot,
  CardSection,
  ProgressBar,
  TagElement,
} from "./DashboardPrimitives";

interface Props {
  data: TimeToLaunchData;
  onResetTimer: () => void;
}

function formatMinutes(ms: number): string {
  if (!ms || ms < 0) return "0m";
  const mins = Math.ceil(ms / 60_000);
  return `${mins}m`;
}

function formatCountdown(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatEta(etaMs: number | null): string {
  if (!etaMs) return "—";
  return new Date(etaMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TimeToLaunchHud({ data, onResetTimer }: Props) {
  const t = useTranslations();
  const goalLabel = t("cms.configurator.time.hud.goal") as string;
  const countdownLabel = data.startMs
    ? formatCountdown(data.countdownMs)
    : (t("cms.configurator.time.hud.startPrompt") as string);
  const remainingLabel = formatMinutes(data.remainingMs);
  const elapsedLabel = data.startMs
    ? formatMinutes(data.elapsedMs)
    : (t("cms.configurator.time.hud.zeroElapsed") as string);

  return (
    <CardRoot className="border border-border/60 bg-surface-2 text-foreground shadow-elevation-4">
      <CardSection className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("cms.configurator.time.hud.title")}
            </p>
            <h3 className="text-lg font-semibold">{goalLabel}</h3>
            <p className="text-xs text-muted-foreground">
              {t("cms.configurator.time.hud.copy")}
            </p>
          </div>
          <TagElement variant={data.onTrack ? "success" : "warning"}>
            {data.onTrack
              ? (t("cms.configurator.time.hud.onTrack") as string)
              : (t("cms.configurator.time.hud.behind") as string)}
          </TagElement>
        </div>

        <ProgressBar
          value={data.progressPercent}
          label={`Elapsed ${elapsedLabel} of 60m goal`}
        />

        <div className="grid gap-3 rounded-xl border border-border/20 bg-surface-3 p-3 text-sm">
          <Inline alignY="center" className="justify-between">
            <span className="text-muted-foreground">
              {t("cms.configurator.time.hud.countdown")}
            </span>
            <TagElement variant={data.onTrack ? "success" : "destructive"}>
              {countdownLabel}
            </TagElement>
          </Inline>
          <Inline alignY="center" className="justify-between">
            <span className="text-muted-foreground">
              {t("cms.configurator.time.hud.remaining")}
            </span>
            <span className="font-semibold text-foreground">{remainingLabel}</span>
          </Inline>
          <Inline alignY="center" className="justify-between">
            <span className="text-muted-foreground">
              {t("cms.configurator.time.hud.eta")}
            </span>
            <span className="font-semibold text-foreground">
              {formatEta(data.etaMs)}
            </span>
          </Inline>
        </div>

        {data.ready ? (
          <div className="relative overflow-hidden rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success-foreground shadow-inner">
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-success/10 via-success/5 to-success/10" />
            <div className="relative space-y-1">
              <p className="text-lg font-bold">
                {data.countdownMs > 0
                  ? "🎉 " + (t("cms.configurator.time.hud.beatTitle") as string)
                  : (t("cms.configurator.time.hud.readyTitle") as string)}
              </p>
              <p className="text-xs text-success-foreground/80">
                {data.countdownMs > 0
                  ? (t("cms.configurator.time.hud.beatBody") as string)
                  : (t("cms.configurator.time.hud.readyBody") as string)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              {t("cms.configurator.time.hud.keepGoing")}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <a
            className="underline"
            href="/docs/cms/build-shop-guide.md#launch-in-under-an-hour"
            target="_blank"
            rel="noreferrer"
          >
            {t("cms.configurator.time.hud.guideLink")}
          </a>
          <button
            type="button"
            className="rounded-full border border-border/60 px-2 py-0.5 text-foreground"
            onClick={onResetTimer}
          >
            {t("cms.configurator.time.hud.reset")}
          </button>
        </div>
      </CardSection>
    </CardRoot>
  );
}
