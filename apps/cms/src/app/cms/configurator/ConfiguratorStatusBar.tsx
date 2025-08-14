// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";

import { useConfigurator } from "./ConfiguratorContext";
import { useGuidedTour } from "./GuidedTour";

export default function ConfiguratorStatusBar(): React.JSX.Element {
  const { saving } = useConfigurator();
  const { replay } = useGuidedTour();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-muted py-2 px-4 text-sm">
      <span>{saving ? "Saving…" : null}</span>
      <button type="button" onClick={replay} className="underline">
        Replay tour
      </button>
    </div>
  );
}
