/**
 * EditorialSidebar — Right-hand sidebar for the guide editor.
 *
 * Replaces brikette's GuideEditorialPanel for the business-os context.
 * Uses plain Tailwind flex/grid instead of brikette's Inline/Stack/Cluster.
 * Translation coverage fetched from API, not i18n hook.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import type {
  ChecklistItemId,
  ChecklistSnapshot,
  ChecklistSnapshotItem,
  ChecklistStatus,
  GuideArea,
  GuideManifestEntry,
  GuideStatus,
  TranslationCoverageResult,
} from "@acme/guide-system";
import {
  CHECKLIST_LABELS,
  GUIDE_AREA_VALUES,
  GUIDE_STATUS_VALUES,
} from "@acme/guide-system";

import { PREVIEW_TOKEN } from "@/lib/guide-authoring/config";

import DiagnosticDetails from "./DiagnosticDetails";
import SeoAuditBadge from "./SeoAuditBadge";

// ── Style constants ──

const STATUS_BADGE_STYLES: Record<GuideStatus, string> = {
  draft: "border-brand-terra/40 bg-brand-terra/15 text-brand-terra/90",
  review: "border-brand-secondary/40 bg-brand-secondary/15 text-brand-secondary/90",
  live: "border-brand-primary/40 bg-brand-primary/15 text-brand-primary/95",
};

const CHECKLIST_BADGE_STYLES: Record<ChecklistStatus, string> = {
  missing: "border-brand-terra/35 bg-brand-terra/10 text-brand-terra/90",
  inProgress: "border-brand-secondary/35 bg-brand-secondary/10 text-brand-secondary/90",
  complete: "border-brand-primary/35 bg-brand-primary/10 text-brand-primary/95",
};

// i18n-exempt -- GUIDES-2470 [ttl=2027-06-01] Internal authoring tool, no public-facing copy
const AREA_LABELS: Record<GuideArea, string> = {
  howToGetHere: "How to get here",
  help: "Help & assistance",
  experience: "Experiences",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function resolveChecklistStatusLabel(value: ChecklistStatus, itemId?: ChecklistItemId): string {
  if (itemId === "seoAudit" && value === "inProgress") return "Below threshold";
  const labels: Record<ChecklistStatus, string> = { missing: "Missing", inProgress: "In progress", complete: "Complete" };
  return labels[value] ?? value;
}

function buildChecklistFromManifest(manifest: GuideManifestEntry): ChecklistSnapshot {
  if (manifest.checklist && manifest.checklist.length > 0) {
    return { items: manifest.checklist.map((item) => ({ ...item })) };
  }
  const ids: ChecklistItemId[] = ["translations", "jsonLd", "faqs", "content", "seoAudit"];
  return { items: ids.map((id) => ({ id, status: "missing" as ChecklistStatus })) };
}

// ── Hook: translation coverage from API ──

function useTranslationCoverage(guideKey: string, previewToken: string) {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<TranslationCoverageResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCoverage() {
      try {
        const res = await fetch("/api/guides/bulk-translation-status", {
          headers: { "x-preview-token": previewToken },
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          guides?: Array<{ key: string; coverage: { complete: string[]; incomplete: string[]; percentage: number } }>;
        };
        if (cancelled || !data?.ok || !data.guides) return;

        const g = data.guides.find((x) => x.key === guideKey);
        if (!g) return;

        const mkLocale = (locale: string, complete: boolean) => ({
          locale: locale as TranslationCoverageResult["locales"][number]["locale"],
          fields: { intro: complete, sections: complete, faqs: complete, seo: complete },
          missing: complete ? [] : (["intro", "sections", "faqs", "seo"] as Array<keyof { intro: boolean; sections: boolean; faqs: boolean; seo: boolean }>),
          complete,
        });

        setCoverage({
          guideKey,
          totalLocales: g.coverage.complete.length + g.coverage.incomplete.length,
          locales: [...g.coverage.complete.map((l) => mkLocale(l, true)), ...g.coverage.incomplete.map((l) => mkLocale(l, false))],
          completeLocales: g.coverage.complete as TranslationCoverageResult["completeLocales"],
          missingLocales: g.coverage.incomplete as TranslationCoverageResult["missingLocales"],
        });
      } catch {
        // coverage is best-effort
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchCoverage();
    return () => { cancelled = true; };
  }, [guideKey, previewToken]);

  return { loading, coverage };
}

// ── Hook: auto-save areas/status ──

function useManifestAutoSave(
  guideKey: string,
  previewToken: string,
  initialAreas: GuideArea[],
  initialPrimary: GuideArea,
  initialStatus: GuideStatus,
) {
  const [selectedAreas, setSelectedAreas] = useState<GuideArea[]>(initialAreas);
  const [primaryArea, setPrimaryArea] = useState<GuideArea>(initialPrimary);
  const [selectedStatus, setSelectedStatus] = useState<GuideStatus>(initialStatus);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef({ areas: initialAreas, primaryArea: initialPrimary, status: initialStatus });

  const saveManifest = useCallback(async (areas: GuideArea[], primary: GuideArea, status: GuideStatus) => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch(`/api/guides/${guideKey}/manifest`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-preview-token": previewToken },
        body: JSON.stringify({ areas, primaryArea: primary, status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to save changes");
      lastSavedRef.current = { areas, primaryArea: primary, status };
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
      setSaveStatus("error");
      setSelectedAreas(lastSavedRef.current.areas);
      setPrimaryArea(lastSavedRef.current.primaryArea);
      setSelectedStatus(lastSavedRef.current.status);
    }
  }, [guideKey, previewToken]);

  useEffect(() => {
    const areasChanged = JSON.stringify(selectedAreas.slice().sort()) !== JSON.stringify(lastSavedRef.current.areas.slice().sort());
    const primaryChanged = primaryArea !== lastSavedRef.current.primaryArea;
    const statusChanged = selectedStatus !== lastSavedRef.current.status;
    if (!areasChanged && !primaryChanged && !statusChanged) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { void saveManifest(selectedAreas, primaryArea, selectedStatus); }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [selectedAreas, primaryArea, selectedStatus, saveManifest]);

  const handleAreaToggle = useCallback((area: GuideArea) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((a) => a !== area);
        if (area === primaryArea) setPrimaryArea(next[0]);
        return next;
      }
      return [...prev, area];
    });
  }, [primaryArea]);

  const handleSetPrimary = useCallback((area: GuideArea) => {
    if (selectedAreas.includes(area)) setPrimaryArea(area);
  }, [selectedAreas]);

  return { selectedAreas, primaryArea, selectedStatus, setSelectedStatus, saveStatus, saveError, handleAreaToggle, handleSetPrimary };
}

// ── Sub-components ──

function AreasSection({
  selectedAreas,
  primaryArea,
  saveStatus,
  saveError,
  onToggle,
  onSetPrimary,
}: {
  selectedAreas: GuideArea[];
  primaryArea: GuideArea;
  saveStatus: SaveStatus;
  saveError: string | null;
  onToggle: (area: GuideArea) => void;
  onSetPrimary: (area: GuideArea) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">Areas</h3>
        <span className={clsx("text-xs", saveStatus === "saving" && "text-brand-secondary", saveStatus === "saved" && "text-brand-primary", saveStatus === "error" && "text-brand-terra")}>
          {saveStatus === "saving" && "Saving..."}{saveStatus === "saved" && "Saved"}{saveStatus === "error" && "Error"}
        </span>
      </div>
      {saveError && <p className="text-xs text-brand-terra">{saveError}</p>}
      <div className="flex flex-wrap gap-2">
        {GUIDE_AREA_VALUES.map((area) => {
          const label = AREA_LABELS[area];
          const isSelected = selectedAreas.includes(area);
          const isPrimary = area === primaryArea;
          const canDeselect = selectedAreas.length > 1;
          return (
            <div key={area} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggle(area)}
                disabled={isSelected && !canDeselect}
                className={clsx(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors transition-opacity",
                  isSelected ? ["border-brand-primary/60 bg-brand-primary/10 text-brand-text", isPrimary && canDeselect && "ring-2 ring-brand-primary/60"] : "border-brand-outline/40 bg-brand-surface text-brand-text opacity-50 hover:opacity-75",
                  !canDeselect && isSelected && "cursor-not-allowed",
                )}
                title={!isSelected ? `Add ${label}` : canDeselect ? `Remove ${label}` : "At least one area required"}
              >
                <span>{label}</span>
                {isPrimary && isSelected && canDeselect && (
                  <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-primary">Primary</span>
                )}
              </button>
              {isSelected && !isPrimary && canDeselect && (
                <button type="button" onClick={() => onSetPrimary(area)} className="rounded px-1.5 py-0.5 text-xs text-brand-text/60 hover:bg-brand-surface hover:text-brand-primary" title={`Set ${label} as primary`}>
                  Set primary
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChecklistSection({
  checklist,
  coverageLoading,
  guideKey,
  manifest,
}: {
  checklist: ChecklistSnapshot;
  coverageLoading: boolean;
  guideKey: string;
  manifest: GuideManifestEntry;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-brand-outline/25 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">Publication Checklist</h3>
      <ul className="flex flex-col gap-2">
        {checklist.items.map((item) => {
          const label = CHECKLIST_LABELS[item.id] ?? item.id;
          const isTranslationsLoading = item.id === "translations" && coverageLoading;
          const displayStatus = isTranslationsLoading ? ("inProgress" as ChecklistStatus) : item.status;
          return (
            <li key={item.id} className="flex w-full items-start justify-between gap-3 rounded-lg border border-brand-outline/25 bg-brand-surface/95 p-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-brand-heading">{label}</p>
                {isTranslationsLoading ? <p className="text-xs text-brand-text/75">Loading translation status...</p> : item.note && item.note !== label ? <p className="text-xs text-brand-text/75">{item.note}</p> : null}
                {!isTranslationsLoading && <DiagnosticDetails itemId={item.id} diagnostics={item.diagnostics} guideKey={guideKey} manifest={manifest} />}
              </div>
              <span className={clsx("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold", CHECKLIST_BADGE_STYLES[displayStatus])}>
                {isTranslationsLoading ? "Loading..." : resolveChecklistStatusLabel(displayStatus, item.id)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SeoAuditSection({ guideKey, checklist }: { guideKey: string; checklist: ChecklistSnapshot }) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewToken = PREVIEW_TOKEN ?? "";

  const seoItem = checklist.items.find((item) => item.id === "seoAudit");
  const hasAudit = seoItem && seoItem.status !== "missing";
  const score = hasAudit && seoItem.note?.includes("Score:") ? parseFloat(seoItem.note.match(/Score: ([\d.]+)\/10/)?.[1] ?? "0") : null;
  const needsImprovement = score !== null && score < 9.0;

  const handleRunAudit = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/guides/${guideKey}/audit?locale=en`, { method: "POST", headers: { "Content-Type": "application/json", "x-preview-token": previewToken } });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Audit failed");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const url = new URL(window.location.href);
      url.searchParams.set("_audit", Date.now().toString());
      window.location.href = url.toString();
    } catch (err) {
      setError((err as Error).message);
      setIsRunning(false);
    }
  }, [guideKey, previewToken]);

  return (
    <section className="flex flex-col gap-3 border-t border-brand-outline/25 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">SEO Audit</h3>
      {hasAudit && score !== null ? (
        <div className="flex items-center gap-3">
          <SeoAuditBadge score={score} />
          {needsImprovement && <p className="text-xs text-amber-700">Score must be &ge;9.0 to publish</p>}
        </div>
      ) : (
        <p className="text-xs text-brand-text/60">No audit completed. Run an audit to check SEO quality.</p>
      )}
      {seoItem?.note && seoItem.note !== "SEO Audit" && <p className="text-xs text-brand-text/75">{seoItem.note}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => void handleRunAudit()} disabled={isRunning} className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", isRunning ? "cursor-not-allowed bg-brand-outline/20 text-brand-text/40" : "bg-brand-primary text-white hover:bg-brand-primary/90")}>
          {isRunning ? "Running..." : hasAudit ? "Re-run SEO Audit" : "Run SEO Audit"}
        </button>
        {hasAudit && needsImprovement && <span className="self-center text-xs text-brand-text/60">Address issues to reach 9.0+</span>}
      </div>
      {error && <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700"><strong>Error:</strong> {error}</div>}
    </section>
  );
}

// ── Main sidebar ──

export default function EditorialSidebar({ manifest, guideKey }: { manifest: GuideManifestEntry; guideKey: string }) {
  const previewToken = PREVIEW_TOKEN ?? "";

  const { loading: coverageLoading, coverage } = useTranslationCoverage(guideKey, previewToken);
  const autoSave = useManifestAutoSave(guideKey, previewToken, manifest.areas, manifest.primaryArea, manifest.status);

  const baseChecklist = useMemo(() => buildChecklistFromManifest(manifest), [manifest]);
  const enhancedChecklist = useMemo<ChecklistSnapshot>(() => ({
    items: baseChecklist.items.map((item): ChecklistSnapshotItem => {
      if (item.id !== "translations" || !coverage) return item;
      const isComplete = coverage.missingLocales.length === 0;
      return {
        ...item,
        status: isComplete ? "complete" : item.status === "complete" ? "inProgress" : item.status,
        diagnostics: { ...item.diagnostics, translations: coverage },
      };
    }),
  }), [baseChecklist, coverage]);

  const outstandingCount = enhancedChecklist.items.filter((i) => i.status !== "complete").length;

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-brand-outline/25 bg-brand-surface/95 p-4 text-sm text-brand-text shadow-sm">
      {/* Status & Workflow */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-brand-heading">Editorial</p>
          <p className="text-xs text-brand-text/80">
            {autoSave.selectedStatus === "live" ? "Published" : autoSave.selectedStatus === "review" ? "In review" : "Draft"}
            <span className="ms-1 text-brand-text/70">&middot; {outstandingCount === 0 ? "All items complete" : `${outstandingCount} outstanding`}</span>
          </p>
        </div>
        <select
          value={autoSave.selectedStatus}
          onChange={(e) => autoSave.setSelectedStatus(e.target.value as GuideStatus)}
          className={clsx("min-h-8 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2", STATUS_BADGE_STYLES[autoSave.selectedStatus])}
        >
          {GUIDE_STATUS_VALUES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <AreasSection
        selectedAreas={autoSave.selectedAreas}
        primaryArea={autoSave.primaryArea}
        saveStatus={autoSave.saveStatus}
        saveError={autoSave.saveError}
        onToggle={autoSave.handleAreaToggle}
        onSetPrimary={autoSave.handleSetPrimary}
      />

      <ChecklistSection checklist={enhancedChecklist} coverageLoading={coverageLoading} guideKey={guideKey} manifest={manifest} />
      <SeoAuditSection guideKey={guideKey} checklist={enhancedChecklist} />

      {/* Links */}
      <section className="flex flex-col gap-2 border-t border-brand-outline/25 pt-4">
        <a href="/guides" className="text-xs font-semibold text-brand-primary underline decoration-brand-primary/40 underline-offset-4 transition-colors hover:text-brand-primary/80">Guides dashboard</a>
      </section>
    </aside>
  );
}
