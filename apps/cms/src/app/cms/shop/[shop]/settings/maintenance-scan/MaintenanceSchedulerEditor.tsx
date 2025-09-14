"use client";

// apps/cms/src/app/cms/shop/[shop]/settings/maintenance-scan/MaintenanceSchedulerEditor.tsx

import { Button, Input } from "@/components/atoms/shadcn";
import { updateMaintenanceSchedule } from "@cms/actions/maintenance.server";
import { useState, type FormEvent, type ChangeEvent } from "react";

export default function MaintenanceSchedulerEditor() {
  const [frequency, setFrequency] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFrequency(e.target.value);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await updateMaintenanceSchedule(fd);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Scan Frequency (ms)</span>
        <Input
          type="number"
          name="frequency"
          value={frequency}
          onChange={handleChange}
        />
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

