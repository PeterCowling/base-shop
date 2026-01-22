// apps/cms/src/app/cms/shop/[shop]/LaunchReadinessPanel.tsx
//
// Displays a launch readiness checklist on the shop dashboard.
// Helps operators validate all required configuration before going live.

import { CmsLaunchChecklist, type CmsLaunchChecklistItem } from "@acme/cms-ui";
import { Tag } from "@acme/design-system/atoms";
import { useTranslations as serverUseTranslations } from "@acme/i18n/useTranslations.server";
import type { ConfiguratorProgress } from "@acme/types";

import {
  buildLaunchChecklist,
  calculateProgressFromServer,
  isLaunchReady,
} from "../../configurator/hooks/dashboard/launchChecklist";

interface LaunchReadinessPanelProps {
  shop: string;
}

async function fetchConfiguratorProgress(
  shopId: string,
): Promise<ConfiguratorProgress | null> {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_CMS_URL || "";
    const res = await fetch(
      `${baseUrl}/api/configurator-progress?shopId=${encodeURIComponent(shopId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as ConfiguratorProgress;
  } catch {
    return null;
  }
}

export default async function LaunchReadinessPanel({
  shop,
}: LaunchReadinessPanelProps) {
  const t = await serverUseTranslations("en");
  const progress = await fetchConfiguratorProgress(shop);

  if (!progress) {
    return (
      <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("cms.shop.launchReadiness.title")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("cms.shop.launchReadiness.noData")}
        </p>
      </section>
    );
  }

  const launchReady = isLaunchReady(progress);
  const progressStats = calculateProgressFromServer(progress);
  const progressPercent = Math.round(
    (progressStats.completedRequired / progressStats.totalRequired) * 100,
  );

  // Build checklist items using shared logic
  const rawItems = buildLaunchChecklist({
    progress,
    translate: (key) => t(key) as string,
  });

  // Map to CmsLaunchChecklistItem format (uses href instead of targetHref)
  const checklistItems: CmsLaunchChecklistItem[] = rawItems.map((item) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    statusLabel: item.statusLabel,
    fixLabel: item.fixLabel,
    href: item.targetHref,
  }));

  // Separate required from optional for display
  const requiredItems = checklistItems.slice(0, progressStats.totalRequired);
  const optionalItems = checklistItems.slice(progressStats.totalRequired);

  return (
    <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("cms.shop.launchReadiness.title")}
          </h2>
          {launchReady ? (
            <Tag variant="success">{t("cms.shop.launchReadiness.ready")}</Tag>
          ) : (
            <Tag variant="warning">
              {progressPercent}% {t("cms.shop.launchReadiness.complete")}
            </Tag>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {progressStats.completedRequired}/{progressStats.totalRequired}{" "}
          {t("cms.shop.launchReadiness.required")}
        </span>
      </div>

      {launchReady ? (
        <p className="mb-4 text-sm text-success">
          {t("cms.shop.launchReadiness.allComplete")}
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("cms.shop.launchReadiness.incomplete")}
        </p>
      )}

      <div className="space-y-4">
        <CmsLaunchChecklist
          items={requiredItems}
          heading={t("cms.shop.launchReadiness.requiredHeading")}
          readyLabel={t("cms.shop.launchReadiness.requiredReady")}
          showReadyCelebration={launchReady}
        />

        {optionalItems.length > 0 && (
          <CmsLaunchChecklist
            items={optionalItems}
            heading={t("cms.shop.launchReadiness.optionalHeading")}
            showReadyCelebration={false}
          />
        )}
      </div>
    </section>
  );
}
