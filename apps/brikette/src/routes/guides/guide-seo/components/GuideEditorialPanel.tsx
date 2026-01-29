"use client";

// src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { Cluster, Inline, Stack } from "@/components/ui/flex";
import { ENABLE_GUIDE_AUTHORING, PREVIEW_TOKEN } from "@/config/env";

import type {
  ChecklistSnapshot,
  ChecklistSnapshotItem,
  ChecklistStatus,
  GuideArea,
  GuideManifestEntry,
} from "../../guide-manifest";
import { CHECKLIST_LABELS, GUIDE_AREA_VALUES, GUIDE_STATUS_VALUES } from "../../guide-manifest";
import DiagnosticDetails from "./DiagnosticDetails";
import SeoAuditBadge from "./SeoAuditBadge";
import { useTranslationCoverage } from "./useTranslationCoverage";

type AreaSaveStatus = "idle" | "saving" | "saved" | "error";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const isAuthoringEnabled = (): boolean => {
  const value = (ENABLE_GUIDE_AUTHORING ?? "").trim().toLowerCase();
  return TRUE_VALUES.has(value);
};

type GuideStatus = GuideManifestEntry["status"];

const STATUS_BADGE_STYLES: Record<GuideStatus, readonly string[]> = {
  draft: ["border-brand-terra/40", "bg-brand-terra/15", "text-brand-terra/90"],
  review: ["border-brand-secondary/40", "bg-brand-secondary/15", "text-brand-secondary/90"],
  live: ["border-brand-primary/40", "bg-brand-primary/15", "text-brand-primary/95"],
} as const;

const STATUS_BADGE_BASE_CLASSES = [
  "min-h-8",
  "rounded-full",
  "border",
  "px-3",
  "py-1",
  "text-xs",
  "font-semibold",
] as const satisfies readonly string[];

const CHECKLIST_BADGE_STYLES: Record<ChecklistStatus, readonly string[]> = {
  missing: ["border-brand-terra/35", "bg-brand-terra/10", "text-brand-terra/90"],
  inProgress: ["border-brand-secondary/35", "bg-brand-secondary/10", "text-brand-secondary/90"],
  complete: ["border-brand-primary/35", "bg-brand-primary/10", "text-brand-primary/95"],
} as const;

const AREA_PILL_BASE_CLASSES = [
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "px-3",
  "py-1",
  "text-xs",
  "font-medium",
  "text-brand-text",
] as const satisfies readonly string[];

const PRIMARY_AREA_RING_CLASSES = ["ring-2", "ring-brand-primary/60"] as const satisfies readonly string[];

const PRIMARY_BADGE_CLASSES = [
  "rounded-full",
  "bg-brand-primary/10",
  "px-2",
  "py-0.5",
  "text-xs",
  "font-semibold",
  "uppercase",
  "tracking-wide",
  "text-brand-primary",
] as const satisfies readonly string[];

const CHECKLIST_ITEM_CONTAINER_CLASSES = [
  "w-full",
  "items-start",
  "justify-between",
  "gap-3",
  "rounded-lg",
  "border",
  "border-brand-outline/25",
  "bg-brand-surface/95",
  "p-3",
] as const satisfies readonly string[];

const CHECKLIST_STATUS_BADGE_BASE_CLASSES = [
  "rounded-full",
  "border",
  "px-2.5",
  "py-0.5",
  "text-xs",
  "font-semibold",
] as const satisfies readonly string[];

interface GuideEditorialPanelProps {
  manifest: GuideManifestEntry;
  status: GuideStatus;
  checklist?: ChecklistSnapshot;
  draftUrl?: string;
  isDraftRoute?: boolean;
  dashboardUrl?: string;
  editUrl?: string;
}

export default function GuideEditorialPanel({
  manifest,
  status,
  checklist,
  draftUrl,
  isDraftRoute,
  dashboardUrl,
  editUrl,
}: GuideEditorialPanelProps): JSX.Element {
  const { t } = useTranslation("guides");

  // Fetch translation coverage from API after hydration to avoid SSR mismatch
  const { isLoading: coverageLoading, coverage } = useTranslationCoverage(manifest.key);

  // Area and status editing state
  // Since this component is dynamically imported with ssr:false, it only runs on client
  const canEditAreas = isAuthoringEnabled() && Boolean(PREVIEW_TOKEN);
  const [selectedAreas, setSelectedAreas] = useState<GuideArea[]>(manifest.areas);
  const [primaryArea, setPrimaryArea] = useState<GuideArea>(manifest.primaryArea);
  const [selectedStatus, setSelectedStatus] = useState<GuideStatus>(status);
  const [areaSaveStatus, setAreaSaveStatus] = useState<AreaSaveStatus>("idle");
  const [areaError, setAreaError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{ areas: GuideArea[]; primaryArea: GuideArea; status: GuideStatus }>({
    areas: manifest.areas,
    primaryArea: manifest.primaryArea,
    status: status,
  });

  // Debug logging to check environment variables
  useEffect(() => {
    console.log('[GuideEditorialPanel] Debug info:', {
      ENABLE_GUIDE_AUTHORING,
      PREVIEW_TOKEN,
      isAuthoringEnabled: isAuthoringEnabled(),
      canEditAreas,
      manifestKey: manifest.key,
      status
    });
  }, [canEditAreas, manifest.key, status]);

  // Auto-save areas and status on change (debounced)
  const saveAreas = useCallback(async (areas: GuideArea[], primary: GuideArea, newStatus: GuideStatus) => {
    if (!canEditAreas) return;

    setAreaSaveStatus("saving");
    setAreaError(null);

    try {
      const response = await fetch(`/api/guides/${manifest.key}/manifest`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-preview-token": PREVIEW_TOKEN ?? "",
        },
        body: JSON.stringify({ areas, primaryArea: primary, status: newStatus }),
      });

      const data = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to save changes");
      }

      // Update last saved state
      lastSavedRef.current = { areas, primaryArea: primary, status: newStatus };
      setAreaSaveStatus("saved");

      // Reset to idle after showing "Saved"
      setTimeout(() => setAreaSaveStatus("idle"), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save changes";
      setAreaError(message);
      setAreaSaveStatus("error");

      // Revert to last known good state
      setSelectedAreas(lastSavedRef.current.areas);
      setPrimaryArea(lastSavedRef.current.primaryArea);
      setSelectedStatus(lastSavedRef.current.status);
    }
  }, [canEditAreas, manifest.key]);

  // Debounced save effect
  useEffect(() => {
    if (!canEditAreas) return;

    // Skip if no changes from last saved state
    const areasChanged =
      JSON.stringify(selectedAreas.slice().sort()) !==
      JSON.stringify(lastSavedRef.current.areas.slice().sort());
    const primaryChanged = primaryArea !== lastSavedRef.current.primaryArea;
    const statusChanged = selectedStatus !== lastSavedRef.current.status;

    if (!areasChanged && !primaryChanged && !statusChanged) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      void saveAreas(selectedAreas, primaryArea, selectedStatus);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [canEditAreas, selectedAreas, primaryArea, selectedStatus, saveAreas]);

  // Toggle area selection
  const handleAreaToggle = (area: GuideArea) => {
    if (!canEditAreas) return;

    setSelectedAreas((prev) => {
      const isSelected = prev.includes(area);

      if (isSelected) {
        // Prevent removing last area
        if (prev.length <= 1) return prev;

        const newAreas = prev.filter((a) => a !== area);

        // If removing primary area, set new primary to first remaining
        if (area === primaryArea) {
          setPrimaryArea(newAreas[0]);
        }

        return newAreas;
      } else {
        return [...prev, area];
      }
    });
  };

  // Set primary area
  const handleSetPrimary = (area: GuideArea) => {
    if (!canEditAreas) return;
    if (!selectedAreas.includes(area)) return;
    setPrimaryArea(area);
  };

  // Change status
  const handleStatusChange = (newStatus: GuideStatus) => {
    if (!canEditAreas) return;
    setSelectedStatus(newStatus);
  };

  // Merge fetched coverage into checklist items
  const enhancedChecklist = useMemo<ChecklistSnapshot | undefined>(() => {
    if (!checklist) return undefined;

    return {
      ...checklist,
      items: checklist.items.map((item): ChecklistSnapshotItem => {
        if (item.id !== "translations") return item;

        // If we have coverage data, use it to determine status
        if (coverage) {
          const isComplete = coverage.missingLocales.length === 0;
          return {
            ...item,
            status: isComplete ? "complete" : item.status === "complete" ? "inProgress" : item.status,
            diagnostics: {
              ...item.diagnostics,
              translations: coverage,
            },
          };
        }

        // While loading, keep existing status but indicate loading
        return item;
      }),
    };
  }, [checklist, coverage]);

  const areaLabelKeyMap: Record<GuideArea, string> = {
    howToGetHere: "dev.editorialPanel.areaLabels.howToGetHere",
    help: "dev.editorialPanel.areaLabels.help",
    experience: "dev.editorialPanel.areaLabels.experience",
  };
  const resolveStatusLabel = (value: GuideStatus): string => {
    const key = `dev.editorialPanel.status.${value}`;
    const translated = t(key);
    return typeof translated === "string" && translated.trim().length > 0 && translated !== key
      ? translated
      : value;
  };
  const resolveChecklistStatusLabel = (value: ChecklistStatus): string => {
    const key = `dev.editorialPanel.checklist.status.${value}`;
    const translated = t(key);
    return typeof translated === "string" && translated.trim().length > 0 && translated !== key
      ? translated
      : value;
  };
  // For display, use edited values if editing, otherwise manifest values
  const displayAreas = canEditAreas ? selectedAreas : manifest.areas;
  const displayPrimary = canEditAreas ? primaryArea : manifest.primaryArea;
  const displayStatus = canEditAreas ? selectedStatus : status;
  const areaOrder = useMemo(
    () => Array.from(new Set<GuideArea>([displayPrimary, ...displayAreas])),
    [displayAreas, displayPrimary],
  );
  const outstandingCount = enhancedChecklist
    ? enhancedChecklist.items.filter((item) => item.status !== "complete").length
    : 0;
  const workflowTitle = t("dev.editorialPanel.title");
  const draftPreviewLabel = t("dev.editorialPanel.workflow.draftPreview");
  const publishedLabel = t("dev.editorialPanel.workflow.published");
  const pendingLabel = t("dev.editorialPanel.workflow.pending");
  const allCompleteLabel = t("dev.editorialPanel.workflow.allComplete");
  const outstandingLabel = t("dev.editorialPanel.workflow.outstanding", { count: outstandingCount });
  const draftPathLabel = t("dev.editorialPanel.draftPath.label");
  const dashboardCta = t("dev.editorialPanel.draftPath.dashboardCta");
  const editCtaKey = "dev.editorialPanel.draftPath.editCta";
  const editCtaRaw = t(editCtaKey);
  const editCta =
    typeof editCtaRaw === "string" && editCtaRaw.trim().length > 0 && editCtaRaw !== editCtaKey
      ? editCtaRaw
      : "Edit guide content"; // i18n-exempt -- GUIDES-2470 authoring CTA fallback
  const publishHeading = t("dev.editorialPanel.publish.heading");
  const primaryLabel = t("dev.editorialPanel.publish.primary");
  const checklistHeading = t("dev.editorialPanel.checklist.heading");
  const workflowState = isDraftRoute
    ? draftPreviewLabel
    : status === "live"
    ? publishedLabel
    : pendingLabel;
  const outstandingText =
    typeof outstandingCount === "number" && enhancedChecklist
      ? outstandingCount === 0
        ? allCompleteLabel
        : outstandingLabel
      : null;

  return (
    <aside className="mb-6 rounded-xl border border-brand-outline/25 bg-brand-surface/95 p-4 text-sm text-brand-text shadow-sm backdrop-blur">
      <Stack className="gap-4">
        <Inline as="div" className="w-full flex-wrap justify-between gap-3">
          <Stack className="gap-1">
            <p className="text-sm font-semibold text-brand-heading">{workflowTitle}</p>
            <p className="text-xs text-brand-text/80">
              <span>{workflowState}</span>
              {outstandingText ? (
                <span className="ms-1 inline-flex items-center gap-1 text-brand-text/70">
                  <span aria-hidden="true">·</span>
                  <span>{outstandingText}</span>
                </span>
              ) : null}
            </p>
          </Stack>
          {canEditAreas ? (
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as GuideStatus)}
              className={clsx(
                STATUS_BADGE_BASE_CLASSES,
                STATUS_BADGE_STYLES[selectedStatus],
                "cursor-pointer transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              )}
            >
              {GUIDE_STATUS_VALUES.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {resolveStatusLabel(statusValue)}
                </option>
              ))}
            </select>
          ) : (
            <Inline
              as="span"
              className={clsx(STATUS_BADGE_BASE_CLASSES, STATUS_BADGE_STYLES[displayStatus])}
            >
              {resolveStatusLabel(displayStatus)}
            </Inline>
          )}
        </Inline>

        {draftUrl ? (
          <Stack as="div" className="gap-1 text-xs text-brand-text/80">
            <span>{draftPathLabel}</span>
            <code className="w-fit rounded bg-brand-surface/80 px-2 py-1 font-mono text-xs text-brand-heading">
              {draftUrl}
            </code>
          </Stack>
        ) : null}
        {dashboardUrl ? (
          <div>
            <Inline
              as="a"
              href={dashboardUrl}
              className="min-h-10 min-w-10 gap-2 text-xs font-semibold text-brand-primary underline decoration-brand-primary/40 underline-offset-4 transition-colors hover:text-brand-primary/80"
            >
              {dashboardCta}
            </Inline>
          </div>
        ) : null}
        {editUrl ? (
          <div>
            <Inline
              as="a"
              href={editUrl}
              className="min-h-10 min-w-10 gap-2 text-xs font-semibold text-brand-secondary underline decoration-brand-secondary/40 underline-offset-4 transition-colors hover:text-brand-secondary/80"
            >
              {editCta}
            </Inline>
          </div>
        ) : null}

        <Stack as="section" className="gap-2">
          <Inline className="items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
              {publishHeading}
            </h3>
            {canEditAreas && (
              <span
                className={clsx(
                  "text-xs",
                  areaSaveStatus === "saving" && "text-brand-secondary",
                  areaSaveStatus === "saved" && "text-brand-primary",
                  areaSaveStatus === "error" && "text-brand-terra",
                  areaSaveStatus === "idle" && "text-brand-text/50",
                )}
              >
                {areaSaveStatus === "saving" && "Saving..."}
                {areaSaveStatus === "saved" && "Saved"}
                {areaSaveStatus === "error" && "Error"}
              </span>
            )}
          </Inline>
          {areaError && canEditAreas && (
            <p className="text-xs text-brand-terra">{areaError}</p>
          )}
          {canEditAreas ? (
            // Editable area selector
            <Cluster as="div" className="gap-2">
              {GUIDE_AREA_VALUES.map((area) => {
                const key = areaLabelKeyMap[area];
                const translated = t(key);
                const label =
                  typeof translated === "string" && translated.trim().length > 0 && translated !== key
                    ? translated
                    : area;
                const isSelected = selectedAreas.includes(area);
                const isPrimary = area === primaryArea;
                const canDeselect = selectedAreas.length > 1;

                return (
                  <Inline
                    as="div"
                    key={area}
                    className="items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={() => handleAreaToggle(area)}
                      disabled={isSelected && !canDeselect}
                      className={clsx(
                        AREA_PILL_BASE_CLASSES,
                        "cursor-pointer transition-all",
                        isSelected
                          ? [
                              "border-brand-primary/60",
                              "bg-brand-primary/10",
                              // Only show primary ring when multiple areas selected
                              isPrimary && selectedAreas.length > 1 && PRIMARY_AREA_RING_CLASSES,
                            ]
                          : [
                              "opacity-50",
                              "hover:opacity-75",
                            ],
                        !canDeselect && isSelected && "cursor-not-allowed",
                      )}
                      title={
                        !isSelected
                          ? `Add to ${label}`
                          : canDeselect
                            ? `Remove from ${label}`
                            : "At least one area required"
                      }
                    >
                      <span>{label}</span>
                      {/* Only show Primary badge when multiple areas are selected */}
                      {isPrimary && isSelected && selectedAreas.length > 1 && (
                        <span className={clsx(PRIMARY_BADGE_CLASSES)}>
                          {primaryLabel}
                        </span>
                      )}
                    </button>
                    {isSelected && !isPrimary && selectedAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(area)}
                        className="rounded px-1.5 py-0.5 text-xs text-brand-text/60 hover:bg-brand-surface hover:text-brand-primary"
                        title={`Set ${label} as primary`}
                      >
                        Set primary
                      </button>
                    )}
                  </Inline>
                );
              })}
            </Cluster>
          ) : (
            // Read-only area display
            <Cluster as="div" className="gap-2">
              {areaOrder.map((area) => {
                const key = areaLabelKeyMap[area];
                const translated = t(key);
                const label =
                  typeof translated === "string" && translated.trim().length > 0 && translated !== key
                    ? translated
                    : area;
                const isPrimary = area === displayPrimary;
                // Only show Primary badge/ring when multiple areas displayed
                const showPrimaryIndicator = isPrimary && areaOrder.length > 1;
                return (
                  <Inline
                    as="span"
                    key={area}
                    className={clsx(
                      AREA_PILL_BASE_CLASSES,
                      showPrimaryIndicator ? PRIMARY_AREA_RING_CLASSES : null,
                    )}
                  >
                    <span>{label}</span>
                    {showPrimaryIndicator ? (
                      <span className={clsx(PRIMARY_BADGE_CLASSES)}>
                        {primaryLabel}
                      </span>
                    ) : null}
                  </Inline>
                );
              })}
            </Cluster>
          )}
        </Stack>

        {enhancedChecklist ? (
          <Stack as="section" className="gap-3 border-t border-brand-outline/25 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
              {checklistHeading}
            </h3>
            <Stack as="ul" className="gap-2">
              {enhancedChecklist.items.map((item) => {
                const label = CHECKLIST_LABELS[item.id] ?? item.id;
                const isTranslationsItem = item.id === "translations";
                const isTranslationsLoading = isTranslationsItem && coverageLoading;
                const isTranslationsIncomplete =
                  isTranslationsItem &&
                  item.status !== "complete" &&
                  item.diagnostics?.translations;
                const incompleteCount = isTranslationsIncomplete
                  ? item.diagnostics?.translations?.missingLocales.length ?? 0
                  : 0;

                // Determine display status for translations
                const displayStatus = isTranslationsLoading ? "inProgress" : item.status;

                return (
                  <Inline
                    as="li"
                    key={item.id}
                    className={clsx(CHECKLIST_ITEM_CONTAINER_CLASSES)}
                  >
                    <Stack className="gap-1">
                      <p className="text-sm font-medium text-brand-heading">{label}</p>
                      {isTranslationsLoading ? (
                        <p className="text-xs text-brand-text/75">Loading translation status...</p>
                      ) : item.note && item.note !== label ? (
                        <p className="text-xs text-brand-text/75">{item.note}</p>
                      ) : null}
                      {!isTranslationsLoading && isTranslationsIncomplete && incompleteCount > 0 && (
                        <div className="rounded-md border border-brand-terra/30 bg-brand-terra/10 p-2 text-xs text-brand-terra">
                          <strong>Action required:</strong> {incompleteCount} locale{incompleteCount !== 1 ? "s" : ""} have incomplete translations.
                          Expand details below to see which files need updates.
                        </div>
                      )}
                      {!isTranslationsLoading && (
                        <DiagnosticDetails
                          itemId={item.id}
                          diagnostics={item.diagnostics}
                          guideKey={manifest.key}
                          manifest={manifest}
                        />
                      )}
                    </Stack>
                    <Inline
                      as="span"
                      className={clsx(
                        CHECKLIST_STATUS_BADGE_BASE_CLASSES,
                        CHECKLIST_BADGE_STYLES[displayStatus],
                      )}
                    >
                      {isTranslationsLoading ? "Loading..." : resolveChecklistStatusLabel(displayStatus)}
                    </Inline>
                  </Inline>
                );
              })}
            </Stack>
          </Stack>
        ) : null}

        {/* SEO Audit Section */}
        {enhancedChecklist && canEditAreas ? (
          <Stack as="section" className="gap-3 border-t border-brand-outline/25 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
              SEO Audit
            </h3>
            <SeoAuditSection
              guideKey={manifest.key}
              checklist={enhancedChecklist}
            />
          </Stack>
        ) : null}
      </Stack>
    </aside>
  );
}

/**
 * SEO Audit Section Component
 * Displays audit results and provides button to run/re-run audit
 */
function SeoAuditSection({
  guideKey,
  checklist,
}: {
  guideKey: string;
  checklist: ChecklistSnapshot;
}): JSX.Element {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the seoAudit checklist item
  const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");
  const hasAudit = seoAuditItem && seoAuditItem.status !== "missing";
  const score = hasAudit && seoAuditItem.note?.includes("Score:")
    ? parseFloat(seoAuditItem.note.match(/Score: ([\d.]+)\/10/)?.[1] ?? "0")
    : null;
  const needsImprovement = score !== null && score < 9.0;

  const handleRunAudit = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const previewToken = PREVIEW_TOKEN ?? "";
      const response = await fetch(`/api/guides/${guideKey}/audit?locale=en`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-preview-token": previewToken,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Audit failed");
      }

      // Refresh the page to show updated checklist with new audit results
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  }, [guideKey]);

  return (
    <Stack className="gap-3">
      {hasAudit && score !== null ? (
        <Inline className="items-center gap-3">
          <SeoAuditBadge score={score} />
          {needsImprovement && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Score must be ≥9.0 to publish
            </p>
          )}
        </Inline>
      ) : (
        <p className="text-xs text-brand-text/60">
          No audit completed. Run an audit to check SEO quality.
        </p>
      )}

      {seoAuditItem?.note && seoAuditItem.note !== "SEO Audit" && (
        <p className="text-xs text-brand-text/75">{seoAuditItem.note}</p>
      )}

      <Inline className="gap-2">
        <button
          type="button"
          onClick={handleRunAudit}
          disabled={isRunning}
          className={clsx(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            isRunning
              ? "bg-brand-outline/20 text-brand-text/40 cursor-not-allowed"
              : "bg-brand-primary text-white hover:bg-brand-primary/90",
          )}
        >
          {isRunning ? "Running..." : hasAudit ? "Re-run SEO Audit" : "Run SEO Audit"}
        </button>

        {hasAudit && needsImprovement && (
          <span className="text-xs text-brand-text/60">
            Address issues to reach 9.0+
          </span>
        )}
      </Inline>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
          <strong>Error:</strong> {error}
        </div>
      )}
    </Stack>
  );
}
