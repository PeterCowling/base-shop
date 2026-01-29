/**
 * SeoAuditDetails - Expandable display of SEO audit analysis
 */
"use client";

import { useState } from "react";
import clsx from "clsx";

import { Inline, Stack } from "@/components/ui/flex";
import type { SeoAuditResult } from "@/routes/guides/guide-manifest-overrides";

const DETAIL_CONTAINER_CLASSES = [
  "rounded-lg",
  "border",
  "border-brand-outline/20",
  "bg-brand-bg/60",
  "p-4",
  "text-sm",
  "text-brand-text/80",
] as const;

interface SeoAuditDetailsProps {
  analysis: SeoAuditResult["analysis"];
  initiallyExpanded?: boolean;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalysisSection({
  title,
  items,
  emoji,
  type = "default",
}: {
  title: string;
  items: string[] | Array<{ issue: string; impact: number }>;
  emoji: string;
  type?: "success" | "error" | "warning" | "default";
}) {
  if (items.length === 0) return null;

  const typeClass =
    type === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : type === "error"
        ? "text-red-700 dark:text-red-400"
        : type === "warning"
          ? "text-amber-700 dark:text-amber-400"
          : "text-brand-text";

  const impactBadgeClass =
    type === "error"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      : type === "warning"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-brand-surface text-brand-text";

  const hasImpact = items.length > 0 && typeof items[0] === "object" && "impact" in items[0];

  return (
    <div className="space-y-2">
      <h4 className={clsx("text-sm font-semibold", typeClass)}>
        {emoji} {title}
        {hasImpact && <span className="text-xs font-normal text-brand-text/60 ml-2">(sorted by impact)</span>}
      </h4>
      <Stack className="gap-1.5">
        {items.map((item, index) => {
          if (typeof item === "string") {
            return (
              <li key={index} className="text-sm text-brand-text/80 list-disc ml-4">
                {item}
              </li>
            );
          }

          return (
            <Inline key={index} className="gap-2 items-start">
              <span className={clsx("shrink-0 rounded px-2 py-0.5 text-xs font-bold", impactBadgeClass)}>
                -{item.impact.toFixed(1)}
              </span>
              <span className="text-sm text-brand-text/80">{item.issue}</span>
            </Inline>
          );
        })}
      </Stack>
    </div>
  );
}

export default function SeoAuditDetails({
  analysis,
  initiallyExpanded = false,
}: SeoAuditDetailsProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const hasContent =
    analysis.strengths.length > 0 ||
    analysis.criticalIssues.length > 0 ||
    analysis.improvements.length > 0;

  if (!hasContent) {
    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-sm text-brand-text/60">No detailed analysis available.</p>
      </div>
    );
  }

  return (
    <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left hover:opacity-70 transition-opacity"
      >
        <span className="text-sm font-semibold text-brand-heading">
          SEO Audit Details
        </span>
        <ChevronIcon
          className={clsx(
            "transition-transform text-brand-text/60",
            isExpanded ? "rotate-90" : "",
          )}
        />
      </button>

      {isExpanded && (
        <Stack className="mt-4 gap-4">
          <AnalysisSection
            title="Critical Issues"
            items={analysis.criticalIssues}
            emoji="❌"
            type="error"
          />

          <AnalysisSection
            title="Improvements"
            items={analysis.improvements}
            emoji="💡"
            type="warning"
          />

          <AnalysisSection
            title="Strengths"
            items={analysis.strengths}
            emoji="✅"
            type="success"
          />
        </Stack>
      )}
    </div>
  );
}
