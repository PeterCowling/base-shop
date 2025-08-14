// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";

import { useConfigurator } from "./ConfiguratorContext";

export default function ConfiguratorStatusBar(): React.JSX.Element | null {
  const { saving } = useConfigurator();
  if (!saving) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-muted py-2 text-sm">
      Saving…
    </div>
  );
}
