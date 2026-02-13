/**
 * SeoAuditBadge — Color-coded badge showing SEO audit score.
 * Ported from brikette's version, simplified for business-os.
 */

interface SeoAuditBadgeProps {
  score: number;
  className?: string;
}

export default function SeoAuditBadge({ score, className = "" }: SeoAuditBadgeProps) {
  const colorClass =
    score >= 9.0
      ? "border-success-soft bg-success-soft text-success-fg"
      : score >= 7.0
        ? "border-warning-soft bg-warning-soft text-warning-fg"
        : "border-danger-soft bg-danger-soft text-danger-fg";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${colorClass} ${className}`}
    >
      SEO: {score.toFixed(1)}/10
    </span>
  );
}
