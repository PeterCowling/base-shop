// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";

import { useConfigurator } from "./ConfiguratorContext";
import { useGuidedTour } from "./GuidedTour";
import { Loader, Tag } from "@ui/components/atoms";
import { CheckIcon } from "@radix-ui/react-icons";

export default function ConfiguratorStatusBar(): React.JSX.Element {
  const { saving, dirty } = useConfigurator();
  const { replay } = useGuidedTour();

  let status: React.ReactNode = null;
  if (saving) {
    status = <Loader size={16} />;
  } else if (dirty) {
    status = <Tag variant="warning">Unsaved changes</Tag>;
  } else {
    status = <CheckIcon className="h-4 w-4 text-success" />;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-muted py-2 px-4 text-sm">
      <span className="flex items-center gap-2">{status}</span>
      <button type="button" onClick={replay} className="underline">
        Replay tour
      </button>
    </div>
  );
}
