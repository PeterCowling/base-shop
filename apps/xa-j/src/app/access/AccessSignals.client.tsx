"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy gate signals pending design/i18n overhaul */

import * as React from "react";

import styles from "./access.module.css";

type AccessSignalsProps = {
  dropLabel?: string;
  dropOpensAt?: string;
  keysRemaining?: string;
  keySeries?: string[];
  monoClassName?: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${pad(remainingHours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function AccessSignals({
  dropLabel,
  dropOpensAt,
  keysRemaining,
  keySeries,
  monoClassName,
}: AccessSignalsProps) {
  const [dropCountdown, setDropCountdown] = React.useState<string | null>(null);
  const [dropLive, setDropLive] = React.useState(false);
  const [seriesIndex, setSeriesIndex] = React.useState(0);

  React.useEffect(() => {
    if (!dropOpensAt) return;
    const target = new Date(dropOpensAt);
    if (Number.isNaN(target.getTime())) return;

    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setDropLive(true);
        setDropCountdown(null);
      } else {
        setDropLive(false);
        setDropCountdown(formatCountdown(diff));
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [dropOpensAt]);

  React.useEffect(() => {
    if (!keySeries || keySeries.length <= 1) return;
    const timer = window.setInterval(() => {
      setSeriesIndex((prev) => (prev + 1) % keySeries.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [keySeries]);

  const hasKeysRemaining = keysRemaining !== undefined && keysRemaining !== "";
  const hasDrop = Boolean(dropLabel || dropOpensAt);
  const hasSeries = Boolean(keySeries && keySeries.length);
  const shouldRender = hasKeysRemaining || hasDrop || hasSeries;
  const seriesLabel = hasSeries ? keySeries?.[seriesIndex] ?? "" : "";
  const dropValue = dropLive
    ? "Live"
    : dropCountdown
      ? `Opens in ${dropCountdown}`
      : "Schedule TBD";

  if (!shouldRender) return null;

  return (
    <div className="mt-5 grid gap-3 rounded-lg border border-border-2 bg-muted p-4 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
      {hasDrop ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{dropLabel || "Next drop"}</span>
          <span className={monoClassName}>{dropValue}</span>
        </div>
      ) : null}
      {hasKeysRemaining ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Keys remaining</span>
          <span className={monoClassName}>{keysRemaining}</span>
        </div>
      ) : null}
      {hasSeries ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Series in circulation</span>
          <span className={`${monoClassName ?? ""} ${styles.signalSwap}`} key={seriesLabel}>
            {seriesLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
