// src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { Cluster, Inline, Stack } from "@/components/ui/flex";

import type {
  ChecklistSnapshot,
  ChecklistStatus,
  GuideArea,
  GuideManifestEntry,
} from "../../guide-manifest";
import { CHECKLIST_LABELS } from "../../guide-manifest";
import DiagnosticDetails from "./DiagnosticDetails";

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
  const areaOrder = useMemo(
    () => Array.from(new Set<GuideArea>([manifest.primaryArea, ...manifest.areas])),
    [manifest.areas, manifest.primaryArea],
  );
  const outstandingCount = checklist
    ? checklist.items.filter((item) => item.status !== "complete").length
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
    typeof outstandingCount === "number" && checklist
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
          <Inline
            as="span"
            className={clsx(STATUS_BADGE_BASE_CLASSES, STATUS_BADGE_STYLES[status])}
          >
            {resolveStatusLabel(status)}
          </Inline>
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
            {publishHeading}
          </h3>
          <Cluster as="div" className="gap-2">
            {areaOrder.map((area) => {
              const key = areaLabelKeyMap[area];
              const translated = t(key);
              const label =
                typeof translated === "string" && translated.trim().length > 0 && translated !== key
                  ? translated
                  : area;
              const isPrimary = area === manifest.primaryArea;
              return (
                <Inline
                  as="span"
                  key={area}
                  className={clsx(
                    AREA_PILL_BASE_CLASSES,
                    isPrimary ? PRIMARY_AREA_RING_CLASSES : null,
                  )}
                >
                  <span>{label}</span>
                  {isPrimary ? (
                    <span className={clsx(PRIMARY_BADGE_CLASSES)}>
                      {primaryLabel}
                    </span>
                  ) : null}
                </Inline>
              );
            })}
          </Cluster>
        </Stack>

        {checklist ? (
          <Stack as="section" className="gap-3 border-t border-brand-outline/25 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/70">
              {checklistHeading}
            </h3>
            <Stack as="ul" className="gap-2">
              {checklist.items.map((item) => {
                const label = CHECKLIST_LABELS[item.id] ?? item.id;
                const isTranslationsIncomplete =
                  item.id === "translations" &&
                  item.status !== "complete" &&
                  item.diagnostics?.translations;
                const incompleteCount = isTranslationsIncomplete
                  ? item.diagnostics?.translations?.missingLocales.length ?? 0
                  : 0;

                return (
                  <Inline
                    as="li"
                    key={item.id}
                    className={clsx(CHECKLIST_ITEM_CONTAINER_CLASSES)}
                  >
                    <Stack className="gap-1">
                      <p className="text-sm font-medium text-brand-heading">{label}</p>
                      {item.note ? (
                        <p className="text-xs text-brand-text/75">{item.note}</p>
                      ) : null}
                      {isTranslationsIncomplete && incompleteCount > 0 && (
                        <div className="rounded-md border border-brand-terra/30 bg-brand-terra/10 p-2 text-xs text-brand-terra">
                          <strong>Action required:</strong> {incompleteCount} locale{incompleteCount !== 1 ? "s" : ""} have incomplete translations.
                          Expand details below to see which files need updates.
                        </div>
                      )}
                      <DiagnosticDetails
                        itemId={item.id}
                        diagnostics={item.diagnostics}
                        guideKey={manifest.key}
                        manifest={manifest}
                      />
                    </Stack>
                    <Inline
                      as="span"
                      className={clsx(
                        CHECKLIST_STATUS_BADGE_BASE_CLASSES,
                        CHECKLIST_BADGE_STYLES[item.status],
                      )}
                    >
                      {resolveChecklistStatusLabel(item.status)}
                    </Inline>
                  </Inline>
                );
              })}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </aside>
  );
}
