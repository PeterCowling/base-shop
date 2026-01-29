// src/routes/guides/guide-seo/components/DiagnosticDetails.tsx
"use client";

import { memo, useCallback, useMemo, useState } from "react";
import clsx from "clsx";

import { Inline, Stack } from "@/components/ui/flex";
import { PREVIEW_TOKEN } from "@/config/env";

import type { ChecklistItemId, GuideManifestEntry } from "../../guide-manifest";
import type { GuideChecklistDiagnostics, TranslationCoverageLocale } from "../../guide-diagnostics.types";

const DETAIL_CONTAINER_CLASSES = [
  "rounded-lg",
  "border",
  "border-brand-outline/20",
  "bg-brand-bg/60",
  "p-3",
  "text-xs",
  "text-brand-text/80",
] as const;

const FIELD_LABELS: Record<string, string> = {
  intro: "Intro",
  sections: "Sections",
  faqs: "FAQs",
  seo: "SEO",
};

/** Chevron icon that rotates when details is open */
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

/** Edit link and optional copy button for incomplete locales */
function TranslationActions({
  locale,
  guideKey,
}: {
  locale: string;
  guideKey: string;
}): JSX.Element {
  const previewParam = PREVIEW_TOKEN ? `&preview=${PREVIEW_TOKEN}` : "";
  const editUrl = `/en/draft/edit/${guideKey}?locale=${locale}${previewParam}`;
  const filePath = `apps/brikette/src/locales/${locale}/guides/content/${guideKey}.json`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(filePath)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        console.info("File path:", filePath);
      });
  }, [filePath]);

  return (
    <Inline className="mt-1 gap-2">
      <a
        href={editUrl}
        className="rounded bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary hover:bg-brand-primary/20"
      >
        Edit {locale}
      </a>
      <button
        onClick={handleCopy}
        type="button"
        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-brand-text/50 hover:bg-brand-surface/80 hover:text-brand-text/70"
        title={filePath}
      >
        {copied ? "Copied!" : "Copy path"}
      </button>
    </Inline>
  );
}

const getStatusLabel = (value: boolean): string => (value ? "OK" : "Missing");

const renderFieldStatus = (value: boolean) => (
  <span
    className={clsx(
      "rounded-full",
      "px-2",
      "py-0.5",
      "text-[10px]",
      "font-semibold",
      value ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-terra/10 text-brand-terra",
    )}
  >
    {getStatusLabel(value)}
  </span>
);

function buildTranslationsRows(locales: TranslationCoverageLocale[]) {
  return locales.map((entry) => ({
    locale: entry.locale,
    intro: entry.fields.intro,
    sections: entry.fields.sections,
    faqs: entry.fields.faqs,
    seo: entry.fields.seo,
  }));
}

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
}): JSX.Element | null {
  if (!diagnostics) return null;

  const translationRows = useMemo(() => {
    if (!diagnostics.translations) return [];
    return buildTranslationsRows(diagnostics.translations.locales);
  }, [diagnostics.translations]);

  if (itemId === "translations" && diagnostics.translations) {
    const { totalLocales, completeLocales, missingLocales } = diagnostics.translations;
    const incompleteCount = totalLocales - completeLocales.length;
    const hasIncomplete = incompleteCount > 0;

    return (
      <details className={clsx(DETAIL_CONTAINER_CLASSES)} open={hasIncomplete}>
        <summary className="cursor-pointer text-xs font-semibold text-brand-primary inline-flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
          <ChevronIcon className="h-4 w-4 transition-transform [[open]>&]:rotate-90" />
          <span>Translation coverage: {completeLocales.length}/{totalLocales} locales</span>
          {hasIncomplete && (
            <span className="rounded-full bg-brand-terra/20 px-2 py-0.5 text-[10px] font-semibold text-brand-terra">
              {incompleteCount} incomplete
            </span>
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
              {translationRows.map((row) => {
                const isIncomplete = missingLocales.includes(row.locale as typeof missingLocales[number]);
                return (
                  <tr key={row.locale}>
                    <td className="px-2 py-1">
                      <Stack className="gap-0">
                        <span className="font-semibold text-brand-heading">{row.locale}</span>
                        {isIncomplete && guideKey && (
                          <TranslationActions locale={row.locale} guideKey={guideKey} />
                        )}
                      </Stack>
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

  if (itemId === "content" && diagnostics.content) {
    const fields = [
      { key: "intro", label: FIELD_LABELS.intro, value: diagnostics.content.intro },
      { key: "sections", label: FIELD_LABELS.sections, value: diagnostics.content.sections },
    ];
    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">Content fields</p>
        <Stack as="ul" className="mt-2 gap-1">
          {fields.map((field) => (
            <Inline key={field.key} className="gap-2">
              <span className="min-w-20 text-[11px] font-medium text-brand-text">
                {field.label}
              </span>
              {renderFieldStatus(field.value)}
            </Inline>
          ))}
        </Stack>
      </div>
    );
  }

  if (itemId === "faqs" && diagnostics.faqs) {
    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">FAQ coverage</p>
        <Inline className="mt-2 gap-2">
          <span className="text-[11px] font-medium text-brand-text">Entries</span>
          <span className="text-[11px] font-semibold text-brand-heading">{diagnostics.faqs.count}</span>
        </Inline>
      </div>
    );
  }

  if (itemId === "jsonLd" && manifest) {
    const structuredTypes = manifest.structuredData.map((sd) =>
      typeof sd === "string" ? sd : sd.type,
    );

    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">Structured Data</p>
        <Stack className="mt-2 gap-2">
          {structuredTypes.length === 0 ? (
            <p className="text-xs text-brand-terra">No structured data declared in manifest</p>
          ) : (
            <Inline className="flex-wrap gap-2">
              {structuredTypes.map((type, i) => (
                <span
                  key={i}
                  className="rounded bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary"
                >
                  {type}
                </span>
              ))}
            </Inline>
          )}
        </Stack>
        <p className="mt-2 text-[10px] text-brand-text/50">
          Structured data is declared in guide-manifest.ts
        </p>
      </div>
    );
  }

  if (itemId === "media" && manifest) {
    const hasHeroBlock = manifest.blocks.some((b) => b.type === "hero");
    const hasGalleryBlock = manifest.blocks.some((b) => b.type === "gallery");

    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">Media blocks</p>
        <Stack className="mt-2 gap-1">
          <Inline className="gap-2">
            <span className="min-w-16 text-[11px] font-medium text-brand-text">Hero</span>
            {renderFieldStatus(hasHeroBlock)}
          </Inline>
          <Inline className="gap-2">
            <span className="min-w-16 text-[11px] font-medium text-brand-text">Gallery</span>
            {renderFieldStatus(hasGalleryBlock)}
          </Inline>
        </Stack>
        <p className="mt-2 text-[10px] text-brand-text/50">
          Media blocks are declared in guide-manifest.ts
        </p>
      </div>
    );
  }

  if (itemId === "seoAudit") {
    return (
      <div className={clsx(DETAIL_CONTAINER_CLASSES)}>
        <p className="text-[10px] font-semibold uppercase text-brand-text/60">SEO Audit</p>
        <Stack className="mt-2 gap-2">
          <p className="text-[11px] text-brand-text/80">
            SEO audits analyze guide content quality across multiple factors:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-brand-text/70 pl-2">
            <li>Meta tags (title and description)</li>
            <li>Content length and structure</li>
            <li>Internal links and FAQs</li>
            <li>Images and freshness signals</li>
            <li>Structured data declarations</li>
          </ul>
          <p className="text-[10px] text-brand-text/50 pt-1">
            Guides must score 9.0/10 or higher to be published to "live" status.
            See the SEO Audit section above for detailed results and recommendations.
          </p>
        </Stack>
      </div>
    );
  }

  return null;
}

export default memo(DiagnosticDetails);
