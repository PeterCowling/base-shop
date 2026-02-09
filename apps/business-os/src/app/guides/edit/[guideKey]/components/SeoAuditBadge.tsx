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
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : score >= 7.0
        ? "border-amber-300 bg-amber-100 text-amber-900"
        : "border-red-300 bg-red-100 text-red-900";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${colorClass} ${className}`}
    >
      SEO: {score.toFixed(1)}/10
    </span>
  );
}
