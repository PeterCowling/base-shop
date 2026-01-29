/**
 * SeoAuditBadge - Color-coded badge showing SEO audit score
 */
import type React from "react";

interface SeoAuditBadgeProps {
  score: number;
  className?: string;
}

export default function SeoAuditBadge({ score, className = "" }: SeoAuditBadgeProps): JSX.Element {
  // Determine color based on score ranges
  const colorClass =
    score >= 9.0
      ? "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-100"
      : score >= 7.0
        ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100"
        : "border-red-300 bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-900 dark:text-red-100";

  const baseClass =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"; // i18n-exempt -- DX-000 [ttl=2026-12-31] CSS utility classes, non-UI

  return (
    <span className={`${baseClass} ${colorClass} ${className}`}>
      SEO: {score.toFixed(1)}/10
    </span>
  );
}
