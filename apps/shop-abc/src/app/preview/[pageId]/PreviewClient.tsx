"use client";

import { useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@i18n/locales";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import DeviceSelector from "@ui/components/DeviceSelector";
import { devicePresets } from "@ui/utils/devicePresets";

interface PreviewClientProps {
  components: PageComponent[];
  locale: Locale;
  initialDeviceId: string;
}

export default function PreviewClient({
  components,
  locale,
  initialDeviceId,
}: PreviewClientProps) {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
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
        <DynamicRenderer components={components} locale={locale} />
      </div>
    </div>
  );
}

