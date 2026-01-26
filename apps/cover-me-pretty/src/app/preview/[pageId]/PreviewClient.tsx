"use client";

import { useMemo } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/page-builder-core";
import DeviceSelector from "@acme/ui/components/DeviceSelector";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";
import { usePreviewDevice } from "@acme/ui/hooks";
import { devicePresets } from "@acme/ui/utils/devicePresets";

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
