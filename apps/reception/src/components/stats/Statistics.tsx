"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@acme/design-system/atoms";

import type { RevenueMode, StatisticsYoyResponse } from "../../schemas/statisticsYoySchema";
import { getFirebaseAuth } from "../../services/firebaseAuth";
import { useFirebaseApp } from "../../services/useFirebase";
import { formatEuro } from "../../utils/format";
import { PageShell } from "../common/PageShell";

function formatPct(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function modeLabel(mode: RevenueMode): string {
  return mode === "room-only" ? "Room only" : "Room + Bar";
}

const Statistics: React.FC = () => {
  const app = useFirebaseApp();
  const currentYear = new Date().getUTCFullYear();

  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState<RevenueMode>("room-plus-bar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatisticsYoyResponse | null>(null);

  const fetchYoY = useCallback(async () => {
    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth(app);
    const token = await auth.currentUser?.getIdToken(true);

    if (!token) {
      setError("Session expired — please sign in again.");
      setLoading(false);
      return;
    }

    const response = await fetch(
      `/api/statistics/yoy?year=${year}&mode=${mode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const payload = (await response.json()) as StatisticsYoyResponse & { error?: string };

    if (!response.ok || !payload.success) {
      setError(payload.error ?? "Failed to load year-on-year statistics");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  }, [app, mode, year]);

  useEffect(() => {
    void fetchYoY();
  }, [fetchYoY]);

  const months = useMemo(() => {
    return data?.monthly ?? [];
  }, [data]);

  return (
    <PageShell title="Year-on-Year Performance">
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              color={mode === "room-plus-bar" ? "primary" : "default"}
              tone={mode === "room-plus-bar" ? "solid" : "outline"}
              onClick={() => setMode("room-plus-bar")}
            >
              Room + Bar
            </Button>
            <Button
              type="button"
              color={mode === "room-only" ? "primary" : "default"}
              tone={mode === "room-only" ? "solid" : "outline"}
              onClick={() => setMode("room-only")}
            >
              Room only
            </Button>
            <Button
              type="button"
              color="default"
              tone="outline"
              onClick={() => setYear((prev) => prev - 1)}
            >
              Previous year
            </Button>
            <Button
              type="button"
              color="default"
              tone="outline"
              onClick={() => setYear((prev) => Math.min(currentYear, prev + 1))}
            >
              Next year
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Mode: <strong>{modeLabel(mode)}</strong> | Period: <strong>{year}</strong> vs <strong>{year - 1}</strong>
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
            Loading statistics...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-6 text-sm text-danger">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{data.year} YTD</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatEuro(data.summary.currentYtd, { style: "locale" })}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{data.previousYear} YTD</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatEuro(data.summary.previousYtd, { style: "locale" })}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">YTD Delta</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatEuro(data.summary.ytdDelta, { style: "locale" })}
                </p>
                <p className="text-sm text-muted-foreground">{formatPct(data.summary.ytdDeltaPct)}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-2 text-left">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">{data.year}</th>
                    <th className="px-3 py-2">{data.previousYear}</th>
                    <th className="px-3 py-2">Delta</th>
                    <th className="px-3 py-2">Delta %</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((row) => (
                    <tr key={row.month} className="border-t border-border">
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2">{formatEuro(row.currentValue, { style: "locale" })}</td>
                      <td className="px-3 py-2">{formatEuro(row.previousValue, { style: "locale" })}</td>
                      <td className="px-3 py-2">{formatEuro(row.delta, { style: "locale" })}</td>
                      <td className="px-3 py-2">{formatPct(row.deltaPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Source: {data.source.current} (current) / {data.source.previous} (comparison).
            </p>
          </>
        ) : null}
      </div>
    </PageShell>
  );
};

export default React.memo(Statistics);
