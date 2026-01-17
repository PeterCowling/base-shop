"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { Cluster, Grid, Stack } from "@acme/ui/components/atoms/primitives";
import type { PortfolioCandidate, PortfolioStrings } from "./types";

const DEFAULT_CONSTRAINTS = {
  cashCap: "120000",
  effortCap: "50",
  maxPilots: "6",
};

type ConstraintsState = typeof DEFAULT_CONSTRAINTS;

function parseMoney(value: string): bigint | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}

function parseIntStrict(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseCents(value: string | null): bigint | null {
  if (!value) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export default function PortfolioClient({
  strings,
}: {
  strings: PortfolioStrings;
}) {
  const [candidates, setCandidates] = useState<PortfolioCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ConstraintsState>(DEFAULT_CONSTRAINTS);
  const [constraints, setConstraints] =
    useState<ConstraintsState>(DEFAULT_CONSTRAINTS);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/candidates?limit=200");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        candidates?: PortfolioCandidate[];
      };
      if (data.ok && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const applyConstraints = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setConstraints(draft);
    },
    [draft],
  );

  const selection = useMemo(() => {
    const cashCap = parseMoney(constraints.cashCap);
    const effortCap = parseIntStrict(constraints.effortCap);
    const maxPilots = parseIntStrict(constraints.maxPilots);
    if (
      cashCap === null ||
      effortCap === null ||
      maxPilots === null ||
      maxPilots === 0
    ) {
      return {
        selected: [] as PortfolioCandidate[],
        cashUsed: 0n,
        effortUsed: 0,
      };
    }

    const ranked = [...candidates].sort((a, b) => {
      const scoreA =
        a.stageR.summary?.rankScore ??
        a.stageK.summary?.annualizedCapitalReturnRate ??
        -Infinity;
      const scoreB =
        b.stageR.summary?.rankScore ??
        b.stageK.summary?.annualizedCapitalReturnRate ??
        -Infinity;
      return scoreB - scoreA;
    });

    const selected: PortfolioCandidate[] = [];
    let cashUsed = 0n;
    let effortUsed = 0;

    for (const candidate of ranked) {
      if (selected.length >= maxPilots) break;
      const cash = parseCents(
        candidate.stageK.summary?.peakCashOutlayCents ?? null,
      );
      const effort = candidate.stageR.summary?.effortScore;
      if (cash === null || effort === null || effort === undefined) continue;
      if (cashUsed + cash > cashCap) continue;
      if (effortUsed + effort > effortCap) continue;
      selected.push(candidate);
      cashUsed += cash;
      effortUsed += effort;
    }

    return { selected, cashUsed, effortUsed };
  }, [candidates, constraints]);

  const cashCapLabel = useMemo(() => {
    const cashCap = parseMoney(constraints.cashCap);
    return cashCap === null ? strings.notAvailable : formatCurrency(cashCap);
  }, [constraints.cashCap, strings.notAvailable]);

  return (
    <div className="grid gap-6">
      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.constraints.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.constraints.title}
          </h2>
        </Stack>
        <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={applyConstraints}>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.fields.cashCap}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={draft.cashCap}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cashCap: event.target.value,
                }))
              }
              disabled={loading}
              type="number"
              min={0}
              step="0.01"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.fields.effortCap}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={draft.effortCap}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  effortCap: event.target.value,
                }))
              }
              disabled={loading}
              type="number"
              min={0}
              step="1"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.fields.maxPilots}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={draft.maxPilots}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  maxPilots: event.target.value,
                }))
              }
              disabled={loading}
              type="number"
              min={1}
              step="1"
            />
          </label>
          <Cluster justify="between" alignY="center" className="gap-3 md:col-span-3">
            <span className="text-xs text-foreground/60">
              {strings.fields.cashCap}: {cashCapLabel}
            </span>
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {strings.constraints.action}
            </button>
          </Cluster>
        </form>
      </section>

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.recommendations.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.recommendations.title}
          </h2>
        </Stack>

        <Grid cols={1} gap={3} className="mt-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.metrics.selectedCount}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {selection.selected.length}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.metrics.cashUsed}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatCurrency(selection.cashUsed)}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.metrics.effortUsed}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatNumber(selection.effortUsed)}
            </div>
          </div>
        </Grid>

        <Stack gap={4} className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-border-1 bg-surface-2 p-4">
              <div className="h-4 w-24 rounded-full bg-foreground/10" />
              <div className="mt-3 h-5 w-48 rounded-full bg-foreground/10" />
              <div className="mt-4 h-3 w-40 rounded-full bg-foreground/10" />
            </div>
          ) : selection.selected.length === 0 ? (
            <div className="text-sm text-foreground/70">
              {strings.recommendations.empty}
            </div>
          ) : (
            selection.selected.map((candidate) => {
              const title =
                candidate.lead?.title ??
                candidate.lead?.url ??
                strings.notAvailable;
              const peakCash = parseCents(
                candidate.stageK.summary?.peakCashOutlayCents ?? null,
              );
              const rankScore =
                candidate.stageR.summary?.rankScore ??
                candidate.stageK.summary?.annualizedCapitalReturnRate ??
                null;
              const effortScore = candidate.stageR.summary?.effortScore ?? null;

              return (
                <div
                  key={candidate.id}
                  className="rounded-3xl border border-border-1 bg-surface-2 p-4"
                >
                  <div className="text-xs text-foreground/60">
                    {candidate.id}
                  </div>
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {title}
                  </Link>
                  <Grid cols={1} gap={3} className="mt-3 md:grid-cols-3">
                    <div className="text-sm text-foreground/70">
                      {strings.fields.rankScore}:{" "}
                      {rankScore !== null && rankScore !== undefined
                        ? formatPercent(rankScore)
                        : strings.notAvailable}
                    </div>
                    <div className="text-sm text-foreground/70">
                      {strings.fields.peakCash}:{" "}
                      {peakCash === null
                        ? strings.notAvailable
                        : formatCurrency(peakCash)}
                    </div>
                    <div className="text-sm text-foreground/70">
                      {strings.fields.effortScore}:{" "}
                      {effortScore ?? strings.notAvailable}
                    </div>
                  </Grid>
                </div>
              );
            })
          )}
        </Stack>
      </section>
    </div>
  );
}
