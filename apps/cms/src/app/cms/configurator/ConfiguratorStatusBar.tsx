// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";

import { useConfigurator } from "./ConfiguratorContext";
import { useGuidedTour } from "./GuidedTour";
import { Loader, Tag } from "@ui/components/atoms";
import { Inline } from "@ui/components/atoms/primitives";
import { CheckIcon } from "@radix-ui/react-icons";
import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";

export default function ConfiguratorStatusBar(): React.JSX.Element {
  const { saving, dirty, state } = useConfigurator();
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

  const shopId = state.shopId;

  const handleHelpClick = () => {
    if (shopId) {
      track("build_flow_help_requested", {
        shopId,
        stepId: "summary",
        surface: "statusBar",
      });
    }
    window.open("/docs/cms/build-shop-guide.md", "_blank", "noreferrer");
  };

  const handleReplayClick = () => {
    if (shopId) {
      track("build_flow_exit", {
        shopId,
        reason: "tour",
        surface: "statusBar",
      });
    }
    replay();
  };

  return (
    <div className="sticky bottom-0 inset-x-0 flex flex-wrap items-center justify-between gap-2 bg-muted py-2 px-4 text-sm">
      <Inline alignY="center">
        {status}
      </Inline>
      <Inline gap={3} alignY="center">
        <button
          type="button"
          onClick={handleHelpClick}
          aria-label={String(t("cms.configurator.help.openBuildGuide"))}
          className="shrink-0 underline inline-flex items-center justify-center min-h-11 min-w-11 px-2"
        >
          {t("cms.configurator.help.label")}
        </button>
        <button
          type="button"
          onClick={handleReplayClick}
          className="shrink-0 underline inline-flex items-center justify-center min-h-11 min-w-11 size-11"
        >
          {t("cms.configurator.replayTour")}
        </button>
      </Inline>
    </div>
  );
}
