"use client";

import { useState } from "react";

import { Button, Input } from "../../../atoms/shadcn";

interface Props {
  onSchedule: (publishAt: string) => Promise<void> | void;
}

const SchedulePublishForm = ({ onSchedule }: Props) => {
  const [publishAt, setPublishAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!publishAt) return;
    setBusy(true);
    try {
      await onSchedule(publishAt);
      setPublishAt("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="col-span-1 space-y-2">
      <div className="text-sm font-medium">Schedule publish{/* i18n-exempt -- PB-1023 */}</div>
      <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
      <Button onClick={submit} disabled={busy || !publishAt}>
        {busy ? "Scheduling…" : "Schedule"}{/* i18n-exempt -- PB-1023 */}
      </Button>
    </div>
  );
};

export default SchedulePublishForm;
