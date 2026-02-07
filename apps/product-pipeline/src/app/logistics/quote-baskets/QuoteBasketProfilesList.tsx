"use client";

import { Cluster, Grid, Stack } from "@acme/design-system/primitives";

import { formatNumber } from "@/lib/format";

import type { QuoteBasketProfile, QuoteBasketStrings } from "./types";

function formatText(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function formatNumeric(value: number | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  return formatNumber(value);
}

export default function QuoteBasketProfilesList({
  profiles,
  loading,
  strings,
}: {
  profiles: QuoteBasketProfile[];
  loading: boolean;
  strings: QuoteBasketStrings;
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
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.list.empty}
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <Cluster justify="between" alignY="center" className="gap-3">
                <Stack gap={1}>
                  <span className="text-xs text-foreground/60">
                    {formatText(profile.profileType, strings.notAvailable)}
                  </span>
                  <span className="text-lg font-semibold">
                    {formatText(profile.name, strings.notAvailable)}
                  </span>
                  <span className="text-xs text-foreground/60">
                    {formatText(profile.origin, strings.notAvailable)} &rarr; {formatText(profile.destination, strings.notAvailable)}
                  </span>
                </Stack>
                {profile.hazmatFlag ? (
                  <span className="rounded-full border border-border-2 px-3 py-1 text-xs">
                    {strings.labels.hazmat}
                  </span>
                ) : null}
              </Cluster>

              <Grid cols={1} gap={3} className="mt-4 text-sm md:grid-cols-3">
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.destinationType}
                  </div>
                  <div className="font-semibold">
                    {formatText(profile.destinationType, strings.notAvailable)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.incoterm}
                  </div>
                  <div className="font-semibold">
                    {formatText(profile.incoterm, strings.notAvailable)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.cartonCount}
                  </div>
                  <div className="font-semibold">
                    {formatNumeric(profile.cartonCount, strings.notAvailable)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.unitsPerCarton}
                  </div>
                  <div className="font-semibold">
                    {formatNumeric(profile.unitsPerCarton, strings.notAvailable)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.weightKg}
                  </div>
                  <div className="font-semibold">
                    {formatNumeric(profile.weightKg, strings.notAvailable)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/60">
                    {strings.fields.cbm}
                  </div>
                  <div className="font-semibold">
                    {formatNumeric(profile.cbm, strings.notAvailable)}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <div className="text-xs text-foreground/60">
                    {strings.fields.dimensionsCm}
                  </div>
                  <div className="font-semibold">
                    {formatText(profile.dimensionsCm, strings.notAvailable)}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <div className="text-xs text-foreground/60">
                    {strings.fields.notes}
                  </div>
                  <div className="font-semibold">
                    {formatText(profile.notes, strings.notAvailable)}
                  </div>
                </div>
              </Grid>
            </div>
          ))
        )}
      </Stack>
    </section>
  );
}
