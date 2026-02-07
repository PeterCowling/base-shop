"use client";

import { useMemo } from "react";

import { usePreviewDevice } from "@acme/cms-ui/hooks/usePreviewDevice";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/page-builder-core";
import DeviceSelector from "@acme/ui/components/DeviceSelector";
import { devicePresets } from "@acme/ui/utils/devicePresets";

import DynamicRenderer from "@/components/DynamicRenderer";

interface PreviewClientProps {
  components: PageComponent[];
  locale: Locale;
  initialDeviceId: string;
  editor?: HistoryState["editor"];
}

export default function PreviewClient({
  components,
  locale,
  initialDeviceId,
  editor,
}: PreviewClientProps) {
  const [deviceId, setDeviceId] = usePreviewDevice(initialDeviceId);
  const device = useMemo(
    () => devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0],
    [deviceId],
  );

  return (
    <div className="space-y-4">
      <DeviceSelector deviceId={deviceId} setDeviceId={setDeviceId} />
      <div
        style={{ width: device.width, height: device.height }}
        className="mx-auto overflow-auto rounded border"
      >
        <DynamicRenderer components={components} locale={locale} editor={editor} />
      </div>
    </div>
  );
}
