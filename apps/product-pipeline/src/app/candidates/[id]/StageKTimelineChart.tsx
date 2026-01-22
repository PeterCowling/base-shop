"use client";

import { useMemo } from "react";
import { Stack } from "@acme/design-system/primitives";

import { formatCurrency } from "@/lib/format";

export type StageKTimeline = {
  days: number[];
  cumulativeCents: number[];
  investedCents: number[];
};

function buildPoints(
  days: number[],
  values: number[],
  maxDay: number,
  minValue: number,
  maxValue: number,
): string {
  const range = Math.max(1, maxValue - minValue);
  return days
    .map((day, index) => {
      const value = values[index] ?? 0;
      const x = maxDay > 0 ? (day / maxDay) * 100 : 0;
      const y = ((maxValue - value) / range) * 60;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function StageKTimelineChart({
  timeline,
  paybackDay,
  currency,
  label,
  notAvailable,
}: {
  timeline: StageKTimeline | null;
  paybackDay: number | null | undefined;
  currency: string;
  label: string;
  notAvailable: string;
}) {
  const chart = useMemo(() => {
    if (!timeline || timeline.days.length === 0) return null;
    const maxDay = timeline.days[timeline.days.length - 1] ?? 0;
    const values = [...timeline.cumulativeCents, ...timeline.investedCents, 0];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const cumulativePoints = buildPoints(
      timeline.days,
      timeline.cumulativeCents,
      maxDay,
      minValue,
      maxValue,
    );
    const investedPoints = buildPoints(
      timeline.days,
      timeline.investedCents,
      maxDay,
      minValue,
      maxValue,
    );
    const zeroY = ((maxValue - 0) / Math.max(1, maxValue - minValue)) * 60;
    const paybackX =
      paybackDay !== null && paybackDay !== undefined && maxDay > 0
        ? (paybackDay / maxDay) * 100
        : null;

    return {
      maxDay,
      cumulativePoints,
      investedPoints,
      zeroY,
      paybackX,
      maxValue,
      minValue,
    };
  }, [paybackDay, timeline]);

  if (!timeline || !chart) {
    return (
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-sm text-foreground/60">
        {notAvailable}
      </div>
    );
  }

  const maxLabel = formatCurrency(BigInt(Math.round(chart.maxValue)), currency);
  const minLabel = formatCurrency(BigInt(Math.round(chart.minValue)), currency);

  return (
    <Stack gap={2} className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
      <div className="text-xs text-foreground/60">{label}</div>
      <svg viewBox="0 0 100 60" className="h-32 w-full">
        <line
          x1="0"
          y1={chart.zeroY}
          x2="100"
          y2={chart.zeroY}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeDasharray="2 3"
        />
        {chart.paybackX !== null ? (
          <line
            x1={chart.paybackX}
            y1="0"
            x2={chart.paybackX}
            y2="60"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
        ) : null}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={chart.cumulativePoints}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.45"
          points={chart.investedPoints}
        />
      </svg>
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </Stack>
  );
}
