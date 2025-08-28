"use client";

import { useCallback, useState } from "react";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";
import PreviewRenderer from "@ui/components/cms/page-builder/PreviewRenderer";
import DeviceSelector from "@ui/components/common/DeviceSelector";

interface Props {
  spec: ScaffoldSpec;
  onBack: () => void;
  onConfirm: () => void;
}

export default function PreviewPane({ spec, onBack, onConfirm }: Props) {
  const [deviceId, setDeviceId] = useState("desktop");
  const handleDevice = useCallback((id: string) => setDeviceId(id), []);
  const handleBack = useCallback(() => onBack(), [onBack]);
  const handleConfirm = useCallback(() => onConfirm(), [onConfirm]);

  return (
    <div className="flex flex-col gap-4">
      <DeviceSelector deviceId={deviceId} onChange={handleDevice} />
      <PreviewRenderer spec={spec} deviceId={deviceId} />
      <div className="flex gap-2">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleConfirm}>Create</button>
      </div>
    </div>
  );
}
