"use client";

import { Stack } from "@acme/ui/components/atoms/primitives";

import type { MissionLoadout } from "../types";

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function parseIntValue(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export default function LoadoutPanel({
  strings,
  loadout,
  onChange,
}: {
  strings: {
    label: string;
    title: string;
    triageLeadCountLabel: string;
    promotionLimitLabel: string;
    marketSweepCountLabel: string;
    stageMKindLabel: string;
    stageMCaptureModeLabel: string;
    stageMCaptureProfileLabel: string;
    stageMMarketplaceLabel: string;
    stageMMaxResultsLabel: string;
    stageMKindAmazonSearch: string;
    stageMKindAmazonListing: string;
    stageMKindTaobaoListing: string;
    stageMCaptureModeRunner: string;
    stageMCaptureModeQueue: string;
    stageMCaptureProfileHelp: string;
  };
  loadout: MissionLoadout;
  onChange: (next: MissionLoadout) => void;
}) {
  const stageMNeedsMarketplace =
    loadout.stageM.kind === "amazon_search" || loadout.stageM.kind === "amazon_listing";

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
      </Stack>

      <div className="mt-6 grid gap-4">
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.triageLeadCountLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="number"
            min={1}
            max={200}
            value={loadout.triageLeadCount}
            onChange={(event) =>
              onChange({
                ...loadout,
                triageLeadCount: clampInt(parseIntValue(event.target.value, 40), 1, 200),
              })
            }
          />
        </label>

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.promotionLimitLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="number"
            min={0}
            max={500}
            value={loadout.promotionLimit}
            onChange={(event) =>
              onChange({
                ...loadout,
                promotionLimit: clampInt(parseIntValue(event.target.value, 5), 0, 500),
              })
            }
          />
        </label>

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.marketSweepCountLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="number"
            min={1}
            max={50}
            value={loadout.marketSweepCandidateCount}
            onChange={(event) =>
              onChange({
                ...loadout,
                marketSweepCandidateCount: clampInt(
                  parseIntValue(event.target.value, 8),
                  1,
                  50,
                ),
              })
            }
          />
        </label>

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageMKindLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={loadout.stageM.kind}
            onChange={(event) =>
              onChange({
                ...loadout,
                stageM: {
                  ...loadout.stageM,
                  kind: event.target.value as MissionLoadout["stageM"]["kind"],
                },
              })
            }
          >
            {/* eslint-disable ds/no-hardcoded-copy -- PP-001 programmatic option values, not user-facing */}
            <option value="amazon_search">{strings.stageMKindAmazonSearch}</option>
            <option value="amazon_listing">{strings.stageMKindAmazonListing}</option>
            <option value="taobao_listing">{strings.stageMKindTaobaoListing}</option>
            {/* eslint-enable ds/no-hardcoded-copy */}
          </select>
        </label>

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageMCaptureModeLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={loadout.stageM.captureMode}
            onChange={(event) =>
              onChange({
                ...loadout,
                stageM: {
                  ...loadout.stageM,
                  captureMode: event.target.value as MissionLoadout["stageM"]["captureMode"],
                },
              })
            }
          >
            <option value="runner">{strings.stageMCaptureModeRunner}</option>
            <option value="queue">{strings.stageMCaptureModeQueue}</option>
          </select>
        </label>

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageMCaptureProfileLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={loadout.stageM.captureProfile}
            onChange={(event) =>
              onChange({
                ...loadout,
                stageM: { ...loadout.stageM, captureProfile: event.target.value },
              })
            }
            type="text"
          />
          <span className="mt-2 block text-xs text-foreground/60 normal-case tracking-normal">
            {strings.stageMCaptureProfileHelp}
          </span>
        </label>

        {stageMNeedsMarketplace && (
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.stageMMarketplaceLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={loadout.stageM.marketplace}
              onChange={(event) =>
                onChange({
                  ...loadout,
                  stageM: { ...loadout.stageM, marketplace: event.target.value },
                })
              }
              type="text"
            />
          </label>
        )}

        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageMMaxResultsLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="number"
            min={1}
            max={100}
            value={loadout.stageM.maxResults}
            onChange={(event) =>
              onChange({
                ...loadout,
                stageM: {
                  ...loadout.stageM,
                  maxResults: clampInt(parseIntValue(event.target.value, 20), 1, 100),
                },
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
