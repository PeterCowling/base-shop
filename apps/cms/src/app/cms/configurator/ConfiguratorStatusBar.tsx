// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";

import { useConfigurator } from "./ConfiguratorContext";
import { useGuidedTour } from "./GuidedTour";
import { Loader, Tag } from "@ui/components/atoms";
import { Inline } from "@ui/components/atoms/primitives";
import { CheckIcon } from "@radix-ui/react-icons";
import { useTranslations } from "@acme/i18n";

export default function ConfiguratorStatusBar(): React.JSX.Element {
  const { saving, dirty } = useConfigurator();
  const { replay } = useGuidedTour();
  const t = useTranslations();

  let status: React.ReactNode = null;
  if (saving) {
    status = <Loader size={16} />;
  } else if (dirty) {
    status = <Tag variant="warning">{t("cms.configurator.unsavedChanges")}</Tag>;
  } else {
    status = <CheckIcon className="h-4 w-4 text-success" />;
  }

  return (
    <div className="sticky bottom-0 inset-x-0 flex flex-wrap items-center justify-between gap-2 bg-muted py-2 px-4 text-sm">
      <Inline alignY="center">{status}</Inline>
      {/* eslint-disable ds/min-tap-size -- CMS-2620 [ttl=2026-01-01] tokenized size present; rule misfire */}
      <button
        type="button"
        onClick={replay}
        className="shrink-0 underline inline-flex items-center justify-center min-h-10 min-w-10 size-10"
      >
        {t("cms.configurator.replayTour")}
      </button>
      {/* eslint-enable ds/min-tap-size -- CMS-2620 */}
    </div>
  );
}
