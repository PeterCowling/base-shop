"use client";

import { useCallback, useMemo, useState } from "react";
import { Cluster, Inline, Stack } from "@acme/ui/components/atoms/primitives";

import { formatNumber, formatPercent } from "@/lib/format";

import type { LaneDetailStrings, LaneEvidence, LaneVersion } from "./types";

const DIFF_FIELDS: Array<{
  key: keyof LaneVersion;
  labelKey: keyof LaneDetailStrings["fields"];
}> = [
  { key: "costAmount", labelKey: "costAmount" },
  { key: "costBasis", labelKey: "costBasis" },
  { key: "leadTimeBaseDays", labelKey: "leadTimeBase" },
  { key: "confidence", labelKey: "confidence" },
  { key: "expiresAt", labelKey: "expiresAt" },
  { key: "currency", labelKey: "currency" },
];

function formatValue(
  value: LaneVersion[keyof LaneVersion],
  strings: LaneDetailStrings,
): string {
  if (value === null || value === undefined || value === "") {
    return strings.notAvailable;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

function formatNumberValue(
  value: number | null | undefined,
  strings: LaneDetailStrings,
): string {
  if (value === null || value === undefined) return strings.notAvailable;
  return formatNumber(value);
}

function formatVariance(
  value: number | null | undefined,
  strings: LaneDetailStrings,
): string {
  if (value === null || value === undefined) return strings.notAvailable;
  return formatPercent(value);
}

function isEligibleForC3(version: LaneVersion): boolean {
  if (version.confidence === "C3") return false;
  if (version.actualsCount < 2) return false;
  const checks = [version.actualCostVariancePct, version.actualLeadTimeVariancePct]
    .filter((value): value is number => value !== null && value !== undefined)
    .map((value) => Math.abs(value) <= 0.1);
  if (checks.length === 0) return false;
  return checks.every(Boolean);
}

function buildEvidenceLink(uri: string): string {
  const prefix = "r2://product-pipeline-evidence/";
  if (uri.startsWith(prefix)) {
    const key = uri.slice(prefix.length);
    return `/api/artifacts/download?key=${encodeURIComponent(key)}`;
  }
  return uri;
}

function getExpiryBadge(
  expiresAt: string | null,
  strings: LaneDetailStrings,
): { label: string; tone: string } | null {
  if (!expiresAt) {
    return { label: strings.badges.noExpiry, tone: "text-foreground/60" };
  }
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return null;
  }
  const diffMs = expires.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) {
    return { label: strings.badges.expired, tone: "text-red-600" };
  }
  if (diffDays <= 14) {
    return { label: `${strings.badges.expiring} ${diffDays}d`, tone: "text-amber-600" };
  }
  return { label: `${strings.badges.valid} ${diffDays}d`, tone: "text-emerald-600" };
}

function diffSummary(
  current: LaneVersion,
  previous: LaneVersion | null,
  strings: LaneDetailStrings,
): string[] {
  if (!previous) return [];
  const changes: string[] = [];
  for (const field of DIFF_FIELDS) {
    const currentValue = formatValue(current[field.key], strings);
    const previousValue = formatValue(previous[field.key], strings);
    if (currentValue !== previousValue) {
      changes.push(
        `${strings.fields[field.labelKey]}: ${previousValue} -> ${currentValue}`,
      );
    }
  }
  return changes.slice(0, 3);
}

export default function LaneVersionList({
  versions,
  strings,
}: {
  versions: LaneVersion[];
  strings: LaneDetailStrings;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState<Record<string, LaneEvidence[]>>({});
  const [loadingEvidence, setLoadingEvidence] = useState<Record<string, boolean>>(
    {},
  );

  const toggleEvidence = useCallback(
    async (versionId: string) => {
      const nextState = !expanded[versionId];
      setExpanded((current) => ({ ...current, [versionId]: nextState }));
      if (!nextState || evidence[versionId]) return;

      setLoadingEvidence((current) => ({ ...current, [versionId]: true }));
      try {
        const response = await fetch(`/api/logistics/lane-versions/${versionId}`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          ok?: boolean;
          evidence?: LaneEvidence[];
        };
        if (data.ok && Array.isArray(data.evidence)) {
          setEvidence((current) => ({ ...current, [versionId]: data.evidence! }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingEvidence((current) => ({ ...current, [versionId]: false }));
      }
    },
    [expanded, evidence],
  );

  const versionDiffs = useMemo(
    () =>
      versions.map((version, index) =>
        diffSummary(version, versions[index + 1] ?? null, strings),
      ),
    [strings, versions],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.detail.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.detail.title}
        </h2>
      </Stack>
      <Stack gap={4} className="mt-6">
        {versions.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.labels.noVersions}
          </div>
        ) : (
          versions.map((version, index) => {
            const expiryBadge = getExpiryBadge(version.expiresAt, strings);
            const diffLines = versionDiffs[index] ?? [];
            const evidenceItems = evidence[version.id] ?? [];
            const evidenceLoading = loadingEvidence[version.id];
            const eligibleForC3 = isEligibleForC3(version);

            return (
              <div
                key={version.id}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <Cluster justify="between" alignY="center" className="gap-4">
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {version.versionLabel ?? strings.placeholders.optional}
                    </span>
                    <span className="text-lg font-semibold">
                      {version.confidence ?? strings.notAvailable} /{" "}
                      {version.currency ?? strings.notAvailable}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {strings.fields.costBasis}: {version.costBasis ?? strings.notAvailable} /{" "}
                      {strings.fields.costAmount}:{" "}
                      {version.costAmount === null || version.costAmount === undefined
                        ? strings.notAvailable
                        : version.costAmount.toFixed(2)}
                    </span>
                  </Stack>
                  <Stack gap={2} className="items-end text-xs">
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {version.status ?? strings.notAvailable}
                    </span>
                    {expiryBadge ? (
                      <span className={`text-xs ${expiryBadge.tone}`}>
                        {expiryBadge.label}
                      </span>
                    ) : null}
                  </Stack>
                </Cluster>
                <Inline gap={3} className="mt-4 text-xs text-foreground/70">
                  <span>
                    {strings.fields.leadTimeBase}:{" "}
                    {version.leadTimeBaseDays ?? strings.notAvailable}d
                  </span>
                  <span>
                    {strings.fields.leadTimeLow}:{" "}
                    {version.leadTimeLowDays ?? strings.notAvailable}d
                  </span>
                  <span>
                    {strings.fields.leadTimeHigh}:{" "}
                    {version.leadTimeHighDays ?? strings.notAvailable}d
                  </span>
                </Inline>
                <div className="mt-3 text-xs text-foreground/60">
                  {version.actualsCount > 0 ? (
                    <Inline gap={3} className="flex-wrap">
                      <span>
                        {strings.labels.actualsCount.replace(
                          "{count}",
                          String(version.actualsCount),
                        )}
                      </span>
                      <span>
                        {strings.labels.actualsAvgCost}:{" "}
                        {formatNumberValue(version.actualCostAvg, strings)}
                      </span>
                      <span>
                        {strings.labels.actualsAvgLeadTime}:{" "}
                        {formatNumberValue(version.actualLeadTimeAvg, strings)}d
                      </span>
                      <span>
                        {strings.labels.actualsVarianceCost}:{" "}
                        {formatVariance(version.actualCostVariancePct, strings)}
                      </span>
                      <span>
                        {strings.labels.actualsVarianceLeadTime}:{" "}
                        {formatVariance(
                          version.actualLeadTimeVariancePct,
                          strings,
                        )}
                      </span>
                      <span>
                        {strings.labels.actualsLatest}:{" "}
                        {version.actualsLatestAt ?? strings.notAvailable}
                      </span>
                    </Inline>
                  ) : (
                    <span>{strings.labels.noActuals}</span>
                  )}
                  {eligibleForC3 ? (
                    <div className="mt-2 text-emerald-600">
                      {strings.labels.eligibleForC3}
                    </div>
                  ) : null}
                </div>
                {diffLines.length > 0 ? (
                  <div className="mt-3 text-xs text-foreground/60">
                    <span className="font-semibold">
                      {strings.labels.versionDiff}:
                    </span>{" "}
                    {diffLines.join(" | ")}
                  </div>
                ) : null}
                <div className="mt-4 text-xs text-foreground/60">
                  {strings.labels.evidenceCount.replace(
                    "{count}",
                    String(version.evidenceCount),
                  )}
                </div>
                <button
                  className="mt-3 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-2 px-4 py-2 text-xs font-semibold"
                  onClick={() => void toggleEvidence(version.id)}
                  type="button"
                >
                  {expanded[version.id]
                    ? strings.labels.hideEvidence
                    : strings.labels.viewEvidence}
                </button>
                {expanded[version.id] ? (
                  <div className="mt-4 rounded-2xl border border-border-1 bg-surface-1/80 p-4 text-xs">
                    {evidenceLoading ? (
                      <div className="text-foreground/60">
                        {strings.notAvailable}
                      </div>
                    ) : evidenceItems.length === 0 ? (
                      <div className="text-foreground/60">
                        {strings.notAvailable}
                      </div>
                    ) : (
                      <Stack gap={2}>
                        {evidenceItems.map((item) => (
                          <Cluster
                            key={item.id}
                            justify="between"
                            alignY="center"
                            className="gap-3"
                          >
                            <div>
                              <span className="font-semibold">{item.kind}</span>{" "}
                              /{" "}
                              <span className="text-foreground/60">
                                {item.createdAt ?? strings.notAvailable}
                              </span>
                            </div>
                            <a
                              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-2 px-3 py-1 text-xs font-semibold"
                              href={buildEvidenceLink(item.uri)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {strings.labels.openDocument}
                            </a>
                          </Cluster>
                        ))}
                      </Stack>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </Stack>
    </section>
  );
}
