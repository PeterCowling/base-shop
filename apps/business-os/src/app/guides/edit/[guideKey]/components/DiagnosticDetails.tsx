/**
 * DiagnosticDetails — Expandable diagnostic info for each checklist item.
 * Ported from brikette's version, adapted for business-os:
 * - Plain divs/spans instead of Inline/Stack flex primitives
 * - TranslationActions links to business-os editor instead of brikette draft routes
 * - No i18n dependency
 */
"use client";

import { memo, useCallback, useMemo, useState } from "react";
import clsx from "clsx";

import type {
  ChecklistItemId,
  GuideChecklistDiagnostics,
  GuideManifestEntry,
  SeoAuditResult,
  TranslationCoverageResult,
} from "@acme/guide-system";

const DETAIL_CONTAINER_CLASSES =
  "rounded-lg border border-brand-outline/20 bg-brand-bg/60 p-3 text-xs text-brand-text/80";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TranslationActions({ locale, guideKey }: { locale: string; guideKey: string }) {
  const editUrl = `/guides/edit/${guideKey}?locale=${locale}`;
  const filePath = `apps/brikette/src/locales/${locale}/guides/content/${guideKey}.json`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(filePath).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => { console.info("File path:", filePath); },
    );
  }, [filePath]);

  return (
    <div className="mt-1 flex items-center gap-2">
      <a href={editUrl} className="rounded bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary hover:bg-brand-primary/20">
        Edit {locale}
      </a>
      <button onClick={handleCopy} type="button" className="rounded px-1.5 py-0.5 text-[10px] font-medium text-brand-text/50 hover:bg-brand-surface/80 hover:text-brand-text/70" title={filePath}>
        {copied ? "Copied!" : "Copy path"}
      </button>
    </div>
  );
}

const renderFieldStatus = (value: boolean) => (
  <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", value ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-terra/10 text-brand-terra")}>
    {value ? "OK" : "Missing"}
  </span>
);

// ── Section: Translations ──

function TranslationsDiagnostic({
  coverage,
  guideKey,
}: {
  coverage: TranslationCoverageResult;
  guideKey?: string;
}) {
  const { totalLocales, completeLocales, missingLocales } = coverage;
  const incompleteCount = totalLocales - completeLocales.length;
  const hasIncomplete = incompleteCount > 0;

  const rows = useMemo(
    () => coverage.locales.map((e) => ({ locale: e.locale, ...e.fields })),
    [coverage.locales],
  );

  return (
    <details className={DETAIL_CONTAINER_CLASSES} open={hasIncomplete}>
      <summary className="cursor-pointer text-xs font-semibold text-brand-primary inline-flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
        <ChevronIcon className="h-4 w-4 transition-transform [[open]>&]:rotate-90" />
        <span>Translation coverage: {completeLocales.length}/{totalLocales} locales</span>
        {hasIncomplete && (
          <span className="rounded-full bg-brand-terra/20 px-2 py-0.5 text-[10px] font-semibold text-brand-terra">{incompleteCount} incomplete</span>
        )}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-[10px] uppercase text-brand-text/60">
            <tr>
              <th className="px-2 py-1 text-start">Locale</th>
              <th className="px-2 py-1 text-start">Intro</th>
              <th className="px-2 py-1 text-start">Sections</th>
              <th className="px-2 py-1 text-start">FAQs</th>
              <th className="px-2 py-1 text-start">SEO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline/10">
            {rows.map((row) => {
              const isIncomplete = missingLocales.includes(row.locale as (typeof missingLocales)[number]);
              return (
                <tr key={row.locale}>
                  <td className="px-2 py-1">
                    <div className="flex flex-col">
                      <span className="font-semibold text-brand-heading">{row.locale}</span>
                      {isIncomplete && guideKey && <TranslationActions locale={row.locale} guideKey={guideKey} />}
                    </div>
                  </td>
                  <td className="px-2 py-1">{renderFieldStatus(row.intro)}</td>
                  <td className="px-2 py-1">{renderFieldStatus(row.sections)}</td>
                  <td className="px-2 py-1">{renderFieldStatus(row.faqs)}</td>
                  <td className="px-2 py-1">{renderFieldStatus(row.seo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ── Section: Content ──

function ContentDiagnostic({ content }: { content: { intro: boolean; sections: boolean } }) {
  const fields = [
    { key: "intro", label: "Intro", value: content.intro },
    { key: "sections", label: "Sections", value: content.sections },
  ];
  return (
    <div className={DETAIL_CONTAINER_CLASSES}>
      <p className="text-[10px] font-semibold uppercase text-brand-text/60">Content fields</p>
      <ul className="mt-2 flex flex-col gap-1">
        {fields.map((f) => (
          <li key={f.key} className="flex items-center gap-2">
            <span className="min-w-20 text-[11px] font-medium text-brand-text">{f.label}</span>
            {renderFieldStatus(f.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Section: FAQs ──

function FaqsDiagnostic({ count }: { count: number }) {
  return (
    <div className={DETAIL_CONTAINER_CLASSES}>
      <p className="text-[10px] font-semibold uppercase text-brand-text/60">FAQ coverage</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] font-medium text-brand-text">Entries</span>
        <span className="text-[11px] font-semibold text-brand-heading">{count}</span>
      </div>
    </div>
  );
}

// ── Section: JSON-LD ──

function JsonLdDiagnostic({ manifest }: { manifest: GuideManifestEntry }) {
  const types = manifest.structuredData.map((sd) => (typeof sd === "string" ? sd : sd.type));
  return (
    <div className={DETAIL_CONTAINER_CLASSES}>
      <p className="text-[10px] font-semibold uppercase text-brand-text/60">Structured Data</p>
      <div className="mt-2 flex flex-col gap-2">
        {types.length === 0 ? (
          <p className="text-xs text-brand-terra">No structured data declared in manifest</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {types.map((type, i) => (
              <span key={i} className="rounded bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">{type}</span>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] text-brand-text/50">Structured data is declared in guide-manifest.ts</p>
    </div>
  );
}

// ── Section: SEO Audit ──

function SeoAuditDiagnostic({ auditResults }: { auditResults?: SeoAuditResult }) {
  if (!auditResults) {
    return (
      <div className={DETAIL_CONTAINER_CLASSES}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">SEO Audit</p>
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-[11px] text-brand-text/80">SEO audits analyze guide content quality across multiple factors:</p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-[11px] text-brand-text/70">
            <li>Meta tags (title and description)</li>
            <li>Content length and structure</li>
            <li>Internal links and FAQs</li>
            <li>Images and freshness signals</li>
            <li>Structured data declarations</li>
          </ul>
          <p className="pt-1 text-[10px] text-brand-text/50">
            Guides must score 9.0/10 or higher to be published to &ldquo;live&rdquo; status. Click &ldquo;Run SEO Audit&rdquo; to analyze this guide.
          </p>
        </div>
      </div>
    );
  }

  const { analysis } = auditResults;
  return (
    <div className={DETAIL_CONTAINER_CLASSES}>
      <p className="text-[10px] font-semibold uppercase text-brand-text/60">Audit Results</p>
      <div className="mt-2 flex flex-col gap-3">
        <ImpactList items={analysis.criticalIssues} label="Critical Issues (sorted by impact)" color="terra" />
        <ImpactList items={analysis.improvements} label="Improvements Recommended (sorted by impact)" color="secondary" />
        {analysis.strengths.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold text-brand-primary">Strengths</p>
            <ul className="list-inside list-disc space-y-0.5 pl-2 text-[11px] text-brand-text/80">
              {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        <p className="border-t border-brand-outline/20 pt-1 text-[10px] text-brand-text/50">
          Score must be 9.0/10 or higher to publish. Address highest-impact items first.
        </p>
      </div>
    </div>
  );
}

function ImpactList({ items, label, color }: { items: Array<{ issue: string; impact: number }>; label: string; color: "terra" | "secondary" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className={`text-[10px] font-semibold text-brand-${color}`}>{label}</p>
      <div className="flex flex-col gap-1">
        {items.map(({ issue, impact }, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`shrink-0 rounded bg-brand-${color}/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-${color}`}>-{impact.toFixed(1)}</span>
            <span className="text-[11px] text-brand-text/80">{issue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main router component ──

function DiagnosticDetails({
  itemId,
  diagnostics,
  guideKey,
  manifest,
}: {
  itemId: ChecklistItemId;
  diagnostics?: GuideChecklistDiagnostics;
  guideKey?: string;
  manifest?: GuideManifestEntry;
}) {
  if (!diagnostics) return null;

  if (itemId === "translations" && diagnostics.translations) {
    return <TranslationsDiagnostic coverage={diagnostics.translations} guideKey={guideKey} />;
  }
  if (itemId === "content" && diagnostics.content) {
    return <ContentDiagnostic content={diagnostics.content} />;
  }
  if (itemId === "faqs" && diagnostics.faqs) {
    return <FaqsDiagnostic count={diagnostics.faqs.count} />;
  }
  if (itemId === "jsonLd" && manifest) {
    return <JsonLdDiagnostic manifest={manifest} />;
  }
  if (itemId === "seoAudit") {
    return <SeoAuditDiagnostic auditResults={diagnostics.seoAudit} />;
  }
  return null;
}

export default memo(DiagnosticDetails);
