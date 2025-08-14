"use client";

import { Button, Checkbox } from "@/components/atoms/shadcn";
import { updateUpsReturns } from "@cms/actions/shops.server";
import { useState, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: { upsEnabled: boolean; bagEnabled: boolean; homePickupEnabled: boolean };
}

export default function ReturnsEditor({ shop, initial }: Props) {
  const [enabled, setEnabled] = useState(initial.upsEnabled);
  const [bagEnabled, setBagEnabled] = useState(initial.bagEnabled);
  const [pickupEnabled, setPickupEnabled] = useState(initial.homePickupEnabled);
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
      setBagEnabled(result.settings.returnService.bagEnabled ?? false);
      setPickupEnabled(result.settings.returnService.homePickupEnabled ?? false);
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
      <label className="flex items-center gap-2">
        <Checkbox
          name="bagEnabled"
          checked={bagEnabled}
          onCheckedChange={(v) => setBagEnabled(Boolean(v))}
        />
        <span>Provide return bags</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          name="homePickupEnabled"
          checked={pickupEnabled}
          onCheckedChange={(v) => setPickupEnabled(Boolean(v))}
        />
        <span>Enable home pickup</span>
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
