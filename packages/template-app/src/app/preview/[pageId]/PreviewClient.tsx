"use client";

import { useMemo } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Locale } from "@i18n/locales";
import DynamicRenderer from "@/components/DynamicRenderer";
import DeviceSelector from "@ui/src/components/DeviceSelector";
import { devicePresets } from "@ui/utils/devicePresets";
import { usePreviewDevice } from "@ui/src/hooks/usePreviewDevice";

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
