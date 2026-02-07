import { promises as fs } from "fs";
import path from "path";

import {
  CmsBuildHero,
  CmsInlineHelpBanner,
  CmsLaunchChecklist,
  type CmsLaunchChecklistItem,
  type CmsLaunchStatus,
} from "@acme/cms-ui"; // UI: @acme/ui/components/cms/CmsBuildHero, CmsInlineHelpBanner, CmsLaunchChecklist
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { validateShopName } from "@acme/platform-core/shops";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum?: string;
  newChecksum?: string;
}

export default async function EditPreviewPage({
  shop,
}: {
  shop: string;
}) {
  const safeShop = validateShopName(shop);
  const t = await getTranslations("en");
  const filePath = path.resolve(
    process.cwd(),
    "..",
    `shop-${safeShop}`,
    "upgrade-changes.json",
  );
  let components: UpgradeComponent[] = [];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-0001: path is derived from validated shop name and static prefix
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    components = Array.isArray(data.components) ? data.components : [];
  } catch {
    // ignore errors if file not found or invalid
  }

  const readinessChecklist: CmsLaunchChecklistItem[] = (() => {
    const statusLabel = (status: CmsLaunchStatus): string => {
      if (status === "complete") {
        return String(
          t("cms.configurator.launchChecklist.status.complete"),
        );
      }
      if (status === "error") {
        return String(t("cms.configurator.launchChecklist.status.error"));
      }
      if (status === "warning") {
        return String(
          t("cms.configurator.launchChecklist.status.warning"),
        );
      }
      return String(
        t("cms.configurator.launchChecklist.status.pending"),
      );
    };

    const hasChanges = components.length > 0;

    const previewStatus: CmsLaunchStatus = hasChanges ? "complete" : "warning";
    const items: CmsLaunchChecklistItem[] = [
      {
        id: "preview-changes-detected",
        label: String(t("cms.editPreview.readiness.hasChanges")),
        status: previewStatus,
        statusLabel: statusLabel(previewStatus),
      },
    ];

    const readyStatus: CmsLaunchStatus = hasChanges ? "complete" : "pending";
    items.push({
      id: "preview-ready-to-edit",
      label: String(t("cms.editPreview.readiness.readyToEdit")),
      status: readyStatus,
      statusLabel: statusLabel(readyStatus),
    });

    return items;
  })();

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <CmsBuildHero
          tag={String(t("cms.upgrade.summary.heading"))}
          title={String(t("cms.editPreview.title", { shop }))}
          body={String(t("cms.upgrade.prepare.desc"))}
          tone="operate"
        />
        <CmsInlineHelpBanner
          heading={String(t("cms.upgrade.summary.heading"))}
          body={String(t("cms.upgrade.prepare.desc"))}
          links={[
            {
              id: "upgrade-docs",
              label: String(t("cms.upgrade.viewSteps")),
              href: "/docs/upgrade-preview-republish.md",
            },
          ]}
        />
        <CmsLaunchChecklist
          heading={String(t("cms.editPreview.readiness.heading"))}
          readyLabel={String(t("cms.editPreview.readiness.readyLabel"))}
          showReadyCelebration
          items={readinessChecklist}
        />
      </section>
      <ul className="list-disc pl-4 text-sm">
        {components.map((c) => (
          <li key={c.file}>{c.componentName}</li>
        ))}
        {components.length === 0 && (
          <li>{t("cms.editPreview.noChanges")}</li>
        )}
      </ul>
    </div>
  );
}
