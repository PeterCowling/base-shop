// src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx
/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route editorial widget; route meta()/links() own head tags */
import { Cluster, InlineItem, Stack } from "@/components/ui/flex";
import appI18n from "@/i18n";
import { useTranslation } from "react-i18next";
import type {
  ChecklistSnapshot,
  ChecklistStatus,
  GuideArea,
  GuideManifestEntry,
} from "../../guide-manifest";
import { CHECKLIST_LABELS } from "../../guide-manifest";

type GuideStatus = GuideManifestEntry["status"];

const GUIDES_NS = "guides";
const DEV_EDITORIAL_PREFIX = "dev.editorialPanel";

const joinTokens = (...tokens: (string | false | null | undefined)[]): string =>
  tokens.filter((token): token is string => typeof token === "string" && token.length > 0).join(" ");

const getDevString = (path: string): string | undefined => {
  const raw = appI18n.getResource("en", GUIDES_NS, `${DEV_EDITORIAL_PREFIX}.${path}`);
  return typeof raw === "string" ? raw : undefined;
};

const STATUS_BADGE_STYLES: Record<GuideStatus, string> = {
  draft: joinTokens(
    "border-brand-secondary/40",
    "bg-brand-secondary/15",
    "text-brand-heading",
  ),
  review: joinTokens("border-brand-primary/35", "bg-brand-primary/10", "text-brand-primary"),
  live: joinTokens("border-brand-terra/35", "bg-brand-terra/10", "text-brand-terra"),
};

const CHECKLIST_BADGE_STYLES: Record<ChecklistStatus, string> = {
  missing: joinTokens(
    "border-brand-bougainvillea/30",
    "bg-brand-bougainvillea/10",
    "text-brand-bougainvillea",
  ),
  inProgress: joinTokens(
    "border-brand-secondary/35",
    "bg-brand-secondary/15",
    "text-brand-heading",
  ),
  complete: joinTokens("border-brand-primary/30", "bg-brand-primary/10", "text-brand-primary"),
};

const STATUS_BADGE_BASE = [
  "inline-flex",
  "items-center",
  "rounded-full",
  "border",
  "px-3",
  "py-1",
  "text-xs",
  "font-semibold",
] as const;

const AREA_BADGE_BASE = [
  "inline-flex",
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "border-brand-outline/25",
  "bg-brand-surface",
  "px-3",
  "py-1",
  "text-xs",
  "font-medium",
  "text-brand-text",
] as const;

const CHECKLIST_BADGE_BASE = [
  "inline-flex",
  "items-center",
  "rounded-full",
  "border",
  "px-2.5",
  "py-0.5",
  "text-xs",
  "font-semibold",
] as const;

const resolveStatusBadgeClass = (value: GuideStatus): string =>
  joinTokens(...STATUS_BADGE_BASE, STATUS_BADGE_STYLES[value]);

const resolveChecklistBadgeClass = (value: ChecklistStatus): string =>
  joinTokens(...CHECKLIST_BADGE_BASE, CHECKLIST_BADGE_STYLES[value]);

const resolveAreaBadgeClass = (isPrimary: boolean): string =>
  joinTokens(
    ...AREA_BADGE_BASE,
    isPrimary ? "ring-1" : undefined,
    isPrimary ? "ring-brand-primary/50" : undefined,
  );

interface GuideEditorialPanelProps {
  manifest: GuideManifestEntry;
  status: GuideStatus;
  checklist?: ChecklistSnapshot;
  draftUrl?: string;
  isDraftRoute?: boolean;
  dashboardUrl?: string;
}

export default function GuideEditorialPanel({
  manifest,
  status,
  checklist,
  draftUrl,
  isDraftRoute,
  dashboardUrl,
}: GuideEditorialPanelProps): JSX.Element {
  const { t } = useTranslation("guides", {
    keyPrefix: "dev.editorialPanel",
    useSuspense: false,
  });
  type TranslateOptions = Extract<Parameters<typeof t>[1], Record<string, unknown>>;
  const translate = (path: string, options?: TranslateOptions) => {
    const fallback = getDevString(path);
    const payload: TranslateOptions = {
      ...(options ?? {}),
      defaultValue: fallback,
    };
    return t(path, payload);
  };
  const areaLabel = (area: GuideArea) => translate(`areas.${area}`);
  const statusLabel = (value: GuideStatus) => translate(`statusLabels.${value}`);
  const checklistStatusLabel = (value: ChecklistStatus) => translate(`checklistStatus.${value}`);
  const areaOrder = Array.from(
    new Set<GuideArea>([manifest.primaryArea, ...manifest.areas]),
  );
  const outstandingCount = checklist
    ? checklist.items.filter((item) => item.status !== "complete").length
    : 0;
  const headingLabel = translate("heading");
  const stateLabel = (() => {
    if (isDraftRoute) {
      return translate("state.draftPreview");
    }
    if (status === "live") {
      return translate("state.published");
    }
    return translate("state.pendingPublication");
  })();
  const outstandingLabel = checklist
    ? outstandingCount === 0
      ? translate("summary.allComplete")
      : translate("summary.outstanding", { count: outstandingCount })
    : null;
  const draftPathLabel = translate("draftPathLabel");
  const openDashboardLabel = translate("openDraftDashboard");
  const publishToLabel = translate("publishToLabel");
  const primaryBadgeLabel = translate("primaryBadge");
  const checklistHeadingLabel = translate("checklistHeading");
  const statusBadgeText = statusLabel(status);

  return (
    <aside className="mb-6 rounded-xl border border-brand-outline/25 bg-brand-surface/90 p-4 text-sm text-brand-text shadow-sm backdrop-blur dark:border-brand-outline/35 dark:bg-brand-surface/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stack className="gap-1">
          <p className="text-sm font-semibold text-brand-heading">{headingLabel}</p>
          <p className="text-xs text-brand-text/70">
            {stateLabel}
            {outstandingLabel ? ` · ${outstandingLabel}` : null}
          </p>
        </Stack>
        <span
          className={resolveStatusBadgeClass(status)}
        >
          {statusLabel(status)}
        </span>
      </div>

      {draftUrl ? (
        <div className="mt-3 text-xs text-brand-text/70">
          {draftPathLabel}:{" "}
          <code className="rounded border border-brand-outline/20 bg-brand-surface px-2 py-1 font-mono text-xs text-brand-heading">
            {draftUrl}
          </code>
        </div>
      ) : null}
      {dashboardUrl ? (
        <div className="mt-2 text-xs">
          <a
            href={dashboardUrl}
            className="inline-flex min-h-10 min-w-10 items-center rounded-lg px-3 font-semibold text-brand-primary underline decoration-brand-primary/40 underline-offset-4 transition-colors hover:text-brand-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            {openDashboardLabel}
          </a>
        </div>
      ) : null}

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
          {publishToLabel}
        </h3>
        <Cluster as="div" className="mt-2">
          {areaOrder.map((area) => {
            const label = areaLabel(area);
            const isPrimary = area === manifest.primaryArea;
            const areaClassName = resolveAreaBadgeClass(isPrimary);
            return (
              <span
                key={area}
                className={areaClassName}
              >
                {label}
                {isPrimary ? (
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    {primaryBadgeLabel}
                  </span>
                ) : null}
              </span>
            );
          })}
        </Cluster>
      </div>

      {checklist ? (
        <div className="mt-4 border-t border-brand-outline/20 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
            {checklistHeadingLabel}
          </h3>
          <ul className="mt-3 space-y-2">
            {checklist.items.map((item) => {
              const label = t(`checklistItems.${item.id}`, {
                defaultValue: CHECKLIST_LABELS[item.id] ?? item.id,
              });
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    {item.note ? (
                      <p className="text-xs text-slate-600">{item.note}</p>
                    ) : null}
                  </div>
                   <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CHECKLIST_BADGE_STYLES[item.status]}`}
                  >
                    {checklistStatusLabel(item.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}