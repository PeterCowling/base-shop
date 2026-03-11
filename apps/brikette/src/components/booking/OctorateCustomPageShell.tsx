"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@acme/design-system/atoms";

import { ensureExternalWidgetScript, readWindowBootstrap } from "@/components/booking/octorateCustomPageRuntime";

// Browser API constant — not translatable user copy
const IFRAME_REFERRER_POLICY = "strict-origin-when-cross-origin" as const;

export type OctorateCustomPageBookingSummary = {
  checkin: string;
  checkout: string;
  pax: number;
  roomName?: string;
  ratePlanLabel?: string;
};

export type OctorateCustomPageBootstrapPayload = {
  container: HTMLDivElement;
  directUrl: string;
  hostPageUrl: string;
  summary: OctorateCustomPageBookingSummary;
};

type OctorateCustomPageBootstrapCleanup = void | (() => void) | { destroy?: () => void };

export type OctorateCustomPageBootstrap = (
  payload: OctorateCustomPageBootstrapPayload
) => OctorateCustomPageBootstrapCleanup | Promise<OctorateCustomPageBootstrapCleanup>;

export type OctorateCustomPageShellLabels = {
  continue: string;
  heading: string;
  loading: string;
  ready: string;
  fallbackTitle: string;
  fallbackBody: string;
  security: string;
  step: string;
  supporting: string;
  widgetHost: string;
};

type Props = {
  labels: OctorateCustomPageShellLabels;
  directUrl: string;
  embedTitle?: string;
  embedUrl?: string;
  summary: OctorateCustomPageBookingSummary;
  summaryLabels: {
    checkin: string;
    checkout: string;
    guests: string;
    rate: string;
    room: string;
  };
  widgetGlobalKey?: string;
  widgetScriptSrc?: string;
  widgetBootstrap?: OctorateCustomPageBootstrap;
};

type EmbedStatus = "loading" | "ready" | "failed";

function normalizeCleanup(
  result: OctorateCustomPageBootstrapCleanup
): (() => void) | undefined {
  if (typeof result === "function") return result;
  if (result && typeof result === "object" && typeof result.destroy === "function") {
    return result.destroy;
  }
  return undefined;
}

function renderSummaryLine(
  label: string,
  value: string | number | undefined,
  key: string
): JSX.Element | null {
  if (value === undefined || value === "") return null;
  return (
    <div key={key} className="flex items-center justify-between gap-4 border-b border-brand-outline/15 py-3 last:border-b-0">
      <dt className="text-sm font-medium text-brand-text/70">{label}</dt>
      <dd className="text-sm font-semibold text-brand-heading">{value}</dd>
    </div>
  );
}

export default function OctorateCustomPageShell({
  labels,
  directUrl,
  embedTitle,
  embedUrl,
  summary,
  summaryLabels,
  widgetGlobalKey,
  widgetScriptSrc,
  widgetBootstrap,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<EmbedStatus>("loading");
  const hasIframeEmbed = Boolean(embedUrl);
  const hasScriptRuntime = Boolean(widgetScriptSrc && widgetGlobalKey);

  useEffect(() => {
    if (hasIframeEmbed) {
      setStatus("loading");
      return undefined;
    }

    const container = containerRef.current;
    if (!container || (!widgetBootstrap && !hasScriptRuntime)) {
      setStatus("failed");
      return undefined;
    }

    let active = true;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      setStatus("loading");
      try {
        let bootstrap: OctorateCustomPageBootstrap | null = widgetBootstrap ?? null;
        if (!bootstrap && widgetScriptSrc && widgetGlobalKey) {
          await ensureExternalWidgetScript(widgetScriptSrc);
          bootstrap = readWindowBootstrap<OctorateCustomPageBootstrap>(widgetGlobalKey);
        }

        if (!bootstrap) {
          throw new Error("Widget bootstrap unavailable");
        }

        const result = await bootstrap({
          container,
          directUrl,
          hostPageUrl: window.location.href,
          summary: {
            checkin: summary.checkin,
            checkout: summary.checkout,
            pax: summary.pax,
            ...(summary.roomName ? { roomName: summary.roomName } : {}),
            ...(summary.ratePlanLabel ? { ratePlanLabel: summary.ratePlanLabel } : {}),
          },
        });
        const nextCleanup = normalizeCleanup(result);
        if (!active) {
          nextCleanup?.();
          return;
        }
        cleanup = nextCleanup;
        setStatus("ready");
      } catch {
        if (!active) return;
        setStatus("failed");
      }
    };

    void run();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [
    directUrl,
    summary.checkin,
    summary.checkout,
    summary.pax,
    summary.ratePlanLabel,
    summary.roomName,
    hasIframeEmbed,
    hasScriptRuntime,
    widgetGlobalKey,
    widgetBootstrap,
    widgetScriptSrc,
  ]);

  return (
    <Section
      as="section"
      width="full"
      padding="none"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-brand-outline/20 bg-brand-surface/95 px-6 py-8 shadow-lg lg:flex-row lg:items-start"
    >
      <div className="w-full space-y-5 lg:w-1/3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
          {labels.step}
        </p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-heading">{labels.heading}</h1>
          <p className="text-base leading-7 text-brand-text/80">{labels.supporting}</p>
        </div>

        <dl className="rounded-3xl border border-brand-outline/15 bg-brand-primary/5 px-5 py-4">
          {renderSummaryLine(summaryLabels.checkin, summary.checkin, "checkin")}
          {renderSummaryLine(summaryLabels.checkout, summary.checkout, "checkout")}
          {renderSummaryLine(summaryLabels.guests, summary.pax, "pax")}
          {renderSummaryLine(summaryLabels.room, summary.roomName, "roomName")}
          {renderSummaryLine(summaryLabels.rate, summary.ratePlanLabel, "ratePlanLabel")}
        </dl>

        <p className="text-sm leading-6 text-brand-text/70">{labels.security}</p>
      </div>

      <div className="w-full rounded-3xl border border-brand-outline/15 bg-brand-surface p-4 shadow-sm">
        {hasIframeEmbed ? (
          <iframe
            aria-label={labels.widgetHost}
            className="aspect-video w-full rounded-2xl border border-brand-outline/20 bg-brand-surface"
            loading="eager"
            referrerPolicy={IFRAME_REFERRER_POLICY}
            src={embedUrl}
            style={{ minHeight: "780px" }}
            title={embedTitle ?? labels.heading}
            onLoad={() => {
              setStatus("ready");
            }}
          />
        ) : (
          <div
            aria-label={labels.widgetHost}
            ref={containerRef}
            className="min-h-96 rounded-2xl border border-dashed border-brand-outline/20 bg-brand-surface"
          />
        )}

        <div className="mt-4" aria-live="polite">
          {status === "loading" ? (
            <p className="text-sm text-brand-text/70">{labels.loading}</p>
          ) : null}
          {status === "ready" ? (
            <p className="text-sm text-brand-text/70">{labels.ready}</p>
          ) : null}
          {status === "failed" ? (
            <div
              role="alert"
              className="rounded-2xl border border-brand-outline/20 bg-brand-primary/5 p-4"
            >
              <h2 className="text-base font-semibold text-brand-heading">{labels.fallbackTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-text/75">{labels.fallbackBody}</p>
              <a
                className="mt-4 inline-flex min-h-11 min-w-11 items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-brand-surface"
                href={directUrl}
                rel="nofollow noopener noreferrer"
                target="_blank"
              >
                {labels.continue}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
