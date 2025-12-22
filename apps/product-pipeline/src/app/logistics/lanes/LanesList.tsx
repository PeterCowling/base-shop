"use client";

import Link from "next/link";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { LaneSummary, LogisticsStrings } from "./types";

function formatLatestSummary(
  lane: LaneSummary,
  strings: LogisticsStrings,
): string {
  if (!lane.latestVersion) return strings.labels.noVersions;
  const version = lane.latestVersion;
  const costAmount =
    version.costAmount === null || version.costAmount === undefined
      ? strings.notAvailable
      : version.costAmount.toFixed(2);
  const costBasis = version.costBasis ?? strings.notAvailable;
  const leadTime =
    version.leadTimeBaseDays === null || version.leadTimeBaseDays === undefined
      ? strings.notAvailable
      : `${version.leadTimeBaseDays}d`;
  const confidence = version.confidence ?? strings.notAvailable;
  return `${confidence} | ${costAmount} ${costBasis} | ${leadTime}`;
}

function formatExpiryBadge(
  expiresAt: string | null,
  strings: LogisticsStrings,
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

export default function LanesList({
  lanes,
  loading,
  strings,
}: {
  lanes: LaneSummary[];
  loading: boolean;
  strings: LogisticsStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.list.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.list.title}
        </h2>
      </Stack>
      <Stack gap={4} className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.notAvailable}
          </div>
        ) : lanes.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.list.empty}
          </div>
        ) : (
          lanes.map((lane) => {
            const expiryBadge = lane.latestVersion
              ? formatExpiryBadge(lane.latestVersion.expiresAt, strings)
              : null;
            const statusLabel = lane.active
              ? strings.badges.active
              : strings.badges.inactive;

            return (
              <div
                key={lane.id}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <Cluster justify="between" alignY="center" className="gap-4">
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {lane.model} - {lane.incoterm ?? strings.notAvailable}
                    </span>
                    <span className="text-lg font-semibold">{lane.name}</span>
                    <span className="text-xs text-foreground/60">
                      {lane.origin ?? strings.notAvailable} &rarr; {lane.destination ?? strings.notAvailable}
                    </span>
                  </Stack>
                  <Stack gap={2} className="items-end text-xs">
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {statusLabel}
                    </span>
                    {expiryBadge ? (
                      <span className={`text-xs ${expiryBadge.tone}`}>
                        {expiryBadge.label}
                      </span>
                    ) : null}
                  </Stack>
                </Cluster>
                <div className="mt-4 text-sm text-foreground/70">
                  {strings.labels.latestVersion}:{" "}
                  <span className="font-semibold">
                    {formatLatestSummary(lane, strings)}
                  </span>
                </div>
                <div className="mt-3 text-xs text-foreground/60">
                  {strings.labels.versionCount}: {lane.versionCount}
                </div>
                <div className="mt-4">
                  <Link
                    className="rounded-full border border-border-2 px-4 py-2 text-xs font-semibold"
                    href={`/logistics/lanes/${lane.id}`}
                  >
                    {strings.labels.viewLane}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </Stack>
    </section>
  );
}
