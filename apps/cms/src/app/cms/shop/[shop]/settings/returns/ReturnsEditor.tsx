"use client";

import { Button, Checkbox } from "@/components/atoms/shadcn";
import { updateUpsReturns } from "@cms/actions/shops.server";
import { useState, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: boolean;
}

export default function ReturnsEditor({ shop, initial }: Props) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateUpsReturns(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.returnService) {
      setEnabled(result.settings.returnService.upsEnabled);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex items-center gap-2">
        <Checkbox
          name="enabled"
          checked={enabled}
          onCheckedChange={(v) => setEnabled(Boolean(v))}
        />
        <span>Enable UPS returns</span>
      </label>
      {errors.enabled && (
        <span className="text-sm text-red-600">{errors.enabled.join("; ")}</span>
      )}
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
